// middleware.js (最终修正版 - 纯 Web 标准 API)

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};

export default function middleware(request) {
  // 1. 使用标准的 URL API 来解析请求的 URL 和路径
  const url = new URL(request.url);
  const { pathname } = url;

  const PASSWORD_PROTECT_PAGE = '/password-protect.html';

  // 如果访问的是密码页本身，直接放行
  if (pathname === PASSWORD_PROTECT_PAGE) {
    return; // 让请求继续
  }

  // 2. 从请求头中获取 cookie 字符串
  const cookieString = request.headers.get('cookie') || '';
  
  // 3. 通过简单的字符串检查来判断是否已认证
  // 这种方法对于我们简单的 'true' 值判断是足够且可靠的
  const isAuthenticated = cookieString.includes('password_correct=true');

  // 如果已经验证通过，也直接放行
  if (isAuthenticated) {
    return; // 让请求继续
  }

  // 如果未验证，则重定向到密码输入页面
  const redirectUrl = new URL(PASSWORD_PROTECT_PAGE, request.url);
  return Response.redirect(redirectUrl, 307);
}