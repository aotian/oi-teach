// middleware.js (通用版本，不依赖任何框架)

export const config = {
  /*
   * 匹配除了以下路径之外的所有请求路径:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   */
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};

export default function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // 你的密码验证页面的路径
  const PASSWORD_PROTECT_PAGE = '/password-protect.html';

  // 如果访问的是密码页本身，直接放行，不执行任何操作
  if (pathname === PASSWORD_PROTECT_PAGE) {
    return; // 让请求继续
  }

  // 从 Cookie 中获取密码验证状态
  const isAuthenticated = request.cookies.get('password_correct')?.value === 'true';

  // 如果已经验证通过，也直接放行
  if (isAuthenticated) {
    return; // 让请求继续
  }

  // 如果以上条件都不满足（即：访问受保护页面且未验证），则重定向到密码输入页面
  const url = new URL(PASSWORD_PROTECT_PAGE, request.url);
  
  // 使用 Web 标准的 Response.redirect() 方法
  // 307 是一个临时重定向的状态码
  return Response.redirect(url, 307);
}