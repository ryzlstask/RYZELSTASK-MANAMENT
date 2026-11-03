import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'ryzels_auth_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass static files, images, favicon, and all API endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = Boolean(token && token.length > 10);

  // If trying to access /login while already authenticated, redirect to /tasks
  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/tasks', request.url));
    }
    return NextResponse.next();
  }

  // If unauthenticated and accessing protected application pages
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('from', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

