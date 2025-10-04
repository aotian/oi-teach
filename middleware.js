// middleware.js

import { NextResponse } from 'next/server';

// 你的密码验证页面的路径
const PASSWORD_PROTECT_PAGE = '/password-protect.html';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // 如果访问的是密码页本身，或者是一些公共资源，直接放行
  if (pathname === PASSWORD_PROTECT_PAGE || pathname.startsWith('/_next/') || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 从 Cookie 中获取密码验证状态
  const isAuthenticated = request.cookies.get('password_correct')?.value === 'true';

  // 如果已经验证通过，则放行
  if (isAuthenticated) {
    return NextResponse.next();
  }

  // 如果未验证，则重定向到密码输入页面
  // 我们需要构建一个完整的 URL
  const url = new URL(PASSWORD_PROTECT_PAGE, request.url);
  return NextResponse.redirect(url);
}

// 配置中间件在哪些路径上生效
export const config = {
  /*
   * 匹配除了以下路径之外的所有请求路径:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   */
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}