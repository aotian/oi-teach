// supabase/functions/upload-r2/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// [!!] 更新了 SDK 版本以解决兼容性报错
import { S3Client, PutObjectCommand,DeleteObjectCommand } from "npm:@aws-sdk/client-s3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
};

serve(async (req: Request): Promise<Response> => {
  // 1. 处理预检请求
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
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

    // --- DELETE 逻辑 ---
    if (req.method === "DELETE") {
      const { fileKey } = await req.json();
      if (!fileKey) throw new Error("Missing fileKey");

      await s3Client.send(new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
      }));

      return new Response(JSON.stringify({ message: "Deleted" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- POST (上传) 逻辑 ---
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
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});