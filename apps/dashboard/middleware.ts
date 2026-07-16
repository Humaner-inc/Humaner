import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { isProtectedAppPath } from '@/lib/routes/public-pathname';

function getSessionCookieName(request: NextRequest): string {
  const isSecure = request.nextUrl.protocol === 'https:';
  return isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token';
}

export function middleware(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;

  if (pathname === '/favicon.ico') {
    return NextResponse.rewrite(new URL('/favicon.svg', request.url));
  }

  if (isProtectedAppPath(pathname)) {
    const cookieName = getSessionCookieName(request);
    const sessionToken = request.cookies.get(cookieName);
    if (!sessionToken?.value) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/favicon.ico',
    '/organization/:path*',
    '/agents/:path*',
    '/desk/:path*',
    '/integrations/:path*',
    '/settings/:path*',
    '/history',
    '/analytics',
    '/knowledge',
    '/human-desk/:path*',
    '/training',
    '/admin/:path*',
    '/dashboard/:path*'
  ]
};
