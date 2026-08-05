import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { isProtectedAppPath } from '@/lib/routes/public-pathname';

function getSessionCookieName(request: NextRequest): string {
  const isSecure = request.nextUrl.protocol === 'https:';
  return isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token';
}

/** Auth.js may chunk large session cookies as `<name>.0`, `<name>.1`, … */
function hasSessionCookie(request: NextRequest): boolean {
  const cookieName = getSessionCookieName(request);
  if (request.cookies.get(cookieName)?.value) {
    return true;
  }
  return Boolean(request.cookies.get(`${cookieName}.0`)?.value);
}

export function middleware(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;

  if (pathname === '/favicon.ico') {
    return NextResponse.rewrite(new URL('/favicon.svg', request.url));
  }

  // Server Actions POST to the current page URL. An HTML login redirect here
  // returns text/html instead of an RSC payload and surfaces as
  // "An unexpected response was received from the server."
  const isServerAction = request.headers.has('next-action');

  if (
    isProtectedAppPath(pathname) &&
    !isServerAction &&
    !hasSessionCookie(request)
  ) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/favicon.ico',
    '/organization/:path*',
    '/agents/:path*',
    '/desk/:path*',
    '/inbox/:path*',
    '/integrations/:path*',
    '/settings/:path*',
    '/history',
    '/analytics',
    '/knowledge',
    '/human-desk/:path*',
    '/training',
    '/admin/:path*',
    '/workspace',
    '/dashboard/:path*',
    // Cookie presence gate for authenticated dashboard APIs (routes still validate session).
    '/api/dashboard/:path*'
  ]
};
