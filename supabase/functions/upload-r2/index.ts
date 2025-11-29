// supabase/functions/upload-r2/index.ts

import { serve } from "https://deno.land/std@0.196.0/http/server.ts";
// [!!] 注意：这里必须引入 DeleteObjectCommand
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.257.0";
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.257.0";

// [!!] 允许 DELETE 方法
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS", 
};

serve(async (req: Request): Promise<Response> => {
  // 1. 预检请求
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    // 2. 初始化 R2 客户端
    const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID") ?? "";
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID") ?? "";
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY") ?? "";
    const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME") ?? "";
    const R2_PUBLIC_URL = Deno.env.get("R2_PUBLIC_URL") ?? "";

    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });

    // ============================================================
    // [!!] 新增分支: 删除文件 (DELETE)
    // ============================================================
    if (req.method === "DELETE") {
      const { fileKey } = await req.json();
      
      if (!fileKey) {
        return new Response(JSON.stringify({ error: "Missing fileKey" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      console.log(`Attempting to delete: ${fileKey}`);

      // 发送删除命令给 R2
      await s3Client.send(new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey, // 确保这里是文件名，不是完整 URL
      }));

      return new Response(JSON.stringify({ message: "Deleted successfully" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ============================================================
    // 原有分支: 上传签名 (POST)
    // ============================================================
    if (req.method === "POST") {
      const { fileName, contentType } = await req.json();
      if (!fileName) throw new Error("fileName is required");

      const ext = fileName.split(".").pop();
      const randomName = `${crypto.randomUUID()}.${ext}`;

      const signedUrl = await getSignedUrl(s3Client, new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: randomName,
        ContentType: contentType,
      }), { expiresIn: 60 * 30 });

      return new Response(
        JSON.stringify({ uploadUrl: signedUrl, publicUrl: `${R2_PUBLIC_URL}/${randomName}`, fileNameInR2: randomName }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});