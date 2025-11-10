// client.js
// 最终版本：自包含 ESM 模块 (ECMAScript Module)
// 此文件不需要在 HTML <head> 中添加任何 <script> 标签。

// 1. 直接从 Supabase CDN 的 ESM 端点导入 createClient 函数
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// 2. 您的项目密钥 (来自您提供的 client.js)
const SUPABASE_URL = 'https://cjsipcanyugnvrikcinx.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqc2lwY2FueXVnbnZyaWtjaW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDkxNTIsImV4cCI6MjA3NzMyNTE1Mn0.5gIeW0BHpVUytUwY_8xeRybUMlkPHMau9ursezkHeJM'; 

// 3. 创建并配置客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { 
    persistSession: true, // 跨页面/刷新保持登录
    autoRefreshToken: true // 自动刷新令牌
  },
});

// 4. 默认导出 (export default)
// 这允许您在其他文件中使用 `import supabase from './client.js'` 来导入
export default supabase;