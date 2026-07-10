import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getSessionCookieName(request: NextRequest): string {
  const isSecure = request.nextUrl.protocol === 'https:';
  return isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token';
}

export function middleware(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname === '/favicon.ico') {
    return NextResponse.rewrite(new URL('/favicon.svg', request.url));
  }

  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');
  if (isDashboard) {
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
  matcher: ['/favicon.ico', '/dashboard/:path*']
};
