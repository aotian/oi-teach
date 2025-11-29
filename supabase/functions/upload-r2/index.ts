// supabase/functions/upload-r2/index.ts

import { serve } from "https://deno.land/std@0.196.0/http/server.ts";
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.257.0";
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.257.0";

// 允许的 CORS 头
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://teach.tongchengweilai.com", // 也可以先写 "*"
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request): Promise<Response> => {
  // 1. ⬅⬅⬅ 一定要最前面先处理 OPTIONS 预检
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // 2. 解析前端 JSON
    const { fileName, contentType } = await req.json();

    if (!fileName) {
      return new Response(JSON.stringify({ error: "fileName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. 读取 R2 配置
    const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID") ?? "";
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID") ?? "";
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY") ?? "";
    const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME") ?? "";
    const R2_PUBLIC_URL = Deno.env.get("R2_PUBLIC_URL") ?? "";

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
      return new Response(
        JSON.stringify({ error: "R2 config is not fully set in Environment Variables" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 4. 配置 S3Client（指向 R2）
    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });

    // 5. 生成 R2 对象名
    const ext = (fileName as string).split(".").pop() || "bin";
    const randomName = `${crypto.randomUUID()}.${ext}`;

    const putCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: randomName,
      ContentType: contentType || "application/octet-stream",
    });

    // 6. 生成签名上传 URL（30 分钟）
    const uploadUrl = await getSignedUrl(s3Client, putCommand, {
      expiresIn: 60 * 30,
    });

    const publicUrl = `${R2_PUBLIC_URL}/${randomName}`;

    // 7. 返回给前端
    return new Response(
      JSON.stringify({
        uploadUrl,
        publicUrl,
        fileNameInR2: randomName,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("upload-r2 error:", error);
    return new Response(
      JSON.stringify({ error: String(error?.message ?? error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
