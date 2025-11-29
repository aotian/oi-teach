// 引入 Deno 标准库和 AWS SDK (用于连接 R2)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.257.0"
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.257.0"

// 设置 CORS 头，允许跨域访问
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. 处理浏览器的预检请求 (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. 获取前端传来的文件名和类型
    const { fileName, contentType } = await req.json()

    // 3. 从环境变量读取 R2 配置 (稍后在网页后台填)
    const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID') ?? ''
    const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID') ?? ''
    const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY') ?? ''
    const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME') ?? ''
    const R2_PUBLIC_URL = Deno.env.get('R2_PUBLIC_URL') ?? ''

    // 4. 初始化 R2 客户端
    const S3 = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })

    // 5. 生成随机文件名 (避免重名覆盖)
    const fileExt = fileName.split('.').pop();
    const randomName = crypto.randomUUID() + '.' + fileExt;

    // 6. 准备上传命令
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: randomName,
      ContentType: contentType,
    })

    // 7. 生成签名 URL (有效期 600秒)
    const signedUrl = await getSignedUrl(S3, command, { expiresIn: 600 })
    const publicUrl = `${R2_PUBLIC_URL}/${randomName}`

    // 8. 返回给前端
    return new Response(
      JSON.stringify({ uploadUrl: signedUrl, publicUrl: publicUrl, fileNameInR2: randomName }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})