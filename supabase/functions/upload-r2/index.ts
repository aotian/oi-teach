// supabase/functions/upload-r2/index.ts

import { serve } from "https://deno.land/std@0.196.0/http/server.ts";
// [!!] 引入 DeleteObjectCommand
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.257.0";
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.257.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS", // [!!] 允许 DELETE 方法
};

serve(async (req: Request): Promise<Response> => {
  // 1. 处理 CORS 预检
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    // 2. 初始化 R2 客户端 (配置保持不变)
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
    // 分支 A: 删除文件 (DELETE 请求) - [新增功能]
    // ============================================================
    if (req.method === "DELETE") {
      const { fileKey } = await req.json();
      
      if (!fileKey) {
        return new Response(JSON.stringify({ error: "Missing fileKey" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      console.log(`Deleting file: ${fileKey}`);

      await s3Client.send(new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
      }));

      return new Response(JSON.stringify({ message: "File deleted successfully" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ============================================================
    // 分支 B: 获取上传签名 (POST 请求) - [原有功能]
    // ============================================================
    if (req.method === "POST") {
      const { fileName, contentType } = await req.json();
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});