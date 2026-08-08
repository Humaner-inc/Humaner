import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { isProtectedAppPath } from '@/lib/routes/public-pathname';

function getSessionCookieName(request: NextRequest): string {
  const isSecure = request.nextUrl.protocol === 'https:';
  return isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token';
}

function getCallbackCookieName(request: NextRequest): string {
  const isSecure = request.nextUrl.protocol === 'https:';
  return isSecure ? '__Secure-authjs.callback-url' : 'authjs.callback-url';
}

function sharedCookieDomain(hostname: string): string | undefined {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost')) {
    return undefined;
  }
  if (host === 'humaner.io' || host.endsWith('.humaner.io')) {
    return '.humaner.io';
  }
  return undefined;
}

/** Auth.js may chunk large session cookies as `<name>.0`, `<name>.1`, … */
function hasSessionCookie(request: NextRequest): boolean {
  const cookieName = getSessionCookieName(request);
  if (request.cookies.get(cookieName)?.value) {
    return true;
  }
  return Boolean(request.cookies.get(`${cookieName}.0`)?.value);
}

function isOssDeploymentRequest(): boolean {
  return (
    process.env.NEXT_PUBLIC_DEPLOYMENT_MODE?.trim().toLowerCase() === 'oss'
  );
}

/** Soft-nav / prefetch flight requests — HTTP redirects break RSC with "Failed to fetch". */
function isRscNavigationRequest(request: NextRequest): boolean {
  return (
    request.headers.get('RSC') === '1' ||
    request.headers.get('Next-Router-Prefetch') === '1' ||
    request.headers.has('Next-Router-State-Tree')
  );
}

/**
 * Cloud-only surfaces that must not compile / soft-nav on Self-Host.
 * Covers public URLs and legacy `/dashboard/*` paths.
 */
function isOssBlockedPath(pathname: string): boolean {
  const paths = [
    pathname,
    pathname.startsWith('/dashboard/')
      ? pathname.slice('/dashboard'.length)
      : pathname
  ];

  return paths.some((path) => {
    if (
      path === '/settings/organization/billing' ||
      path.startsWith('/settings/organization/billing/')
    ) {
      return true;
    }
    if (path === '/inbox' || path.startsWith('/inbox/')) {
      return true;
    }
    return false;
  });
}

export function middleware(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;

  if (pathname === '/favicon.ico') {
    return NextResponse.rewrite(new URL('/favicon.svg', request.url));
  }

  // Self-Host: Polar billing + Cloud inbox are not part of the kit.
  // Prefer rewrite for RSC so App Router flight stays valid; redirect for
  // full document navigations.
  if (isOssDeploymentRequest() && isOssBlockedPath(pathname)) {
    if (isRscNavigationRequest(request)) {
      return NextResponse.rewrite(new URL('/dashboard/home', request.url));
    }
    return NextResponse.redirect(
      new URL('/organization/overview', request.url)
    );
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
    // Dashboard API polls (e.g. /api/dashboard/desk/open-count) must not
    // redirect to login or poison the Auth.js callback cookie — that sent
    // users to raw JSON after sign-in.
    if (
      pathname === '/api/dashboard' ||
      pathname.startsWith('/api/dashboard/')
    ) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const callbackPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', callbackPath);

    const response = NextResponse.redirect(loginUrl);
    // Persist for TOTP / recovery / OAuth — query alone is not enough once
    // the user leaves /auth/login for the MFA challenge.
    const isSecure = request.nextUrl.protocol === 'https:';
    response.cookies.set({
      name: getCallbackCookieName(request),
      value: callbackPath,
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      ...(sharedCookieDomain(request.nextUrl.hostname)
        ? { domain: sharedCookieDomain(request.nextUrl.hostname) }
        : {})
    });
    return response;
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
