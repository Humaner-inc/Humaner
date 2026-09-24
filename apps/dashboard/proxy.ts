import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { isProtectedAppPath } from '@/lib/routes/public-pathname';

const SESSION_COOKIE_NAMES = [
  '__Secure-authjs.session-token',
  'authjs.session-token'
] as const;

function requestIsHttps(request: NextRequest): boolean {
  const forwarded = request.headers.get('x-forwarded-proto');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() === 'https';
  }
  return request.nextUrl.protocol === 'https:';
}

function getCallbackCookieName(request: NextRequest): string {
  return requestIsHttps(request)
    ? '__Secure-authjs.callback-url'
    : 'authjs.callback-url';
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

/**
 * Same gate as 062be0aa (working): any session cookie or Auth.js chunk counts.
 * Do not require a UUID — that bounce is what broke login after v1.1.
 */
function hasSessionCookie(request: NextRequest): boolean {
  for (const cookieName of SESSION_COOKIE_NAMES) {
    if (request.cookies.get(cookieName)?.value) {
      return true;
    }
    if (request.cookies.get(`${cookieName}.0`)?.value) {
      return true;
    }
  }
  return false;
}

/** Default app homes — unsigned visitors should see /auth/login, not a bounce URL. */
function isDefaultSignedInHome(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/overview' ||
    pathname === '/inbox' ||
    pathname === '/inbox/all' ||
    pathname === '/organization' ||
    pathname === '/organization/overview'
  );
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
    if (path === '/overview' || path.startsWith('/overview/')) {
      return true;
    }
    if (path === '/inbox' || path.startsWith('/inbox/')) {
      return true;
    }
    if (path === '/tasks' || path.startsWith('/tasks/')) {
      return true;
    }
    if (path === '/calendar' || path.startsWith('/calendar/')) {
      return true;
    }
    if (path === '/resources' || path.startsWith('/resources/')) {
      return true;
    }
    if (
      path === '/organization/tasks' ||
      path.startsWith('/organization/tasks/') ||
      path === '/organization/resources' ||
      path.startsWith('/organization/resources/')
    ) {
      return true;
    }
    if (path === '/onboarding' || path.startsWith('/onboarding/')) {
      return true;
    }
    if (path === '/knowledge' || path.startsWith('/knowledge/')) {
      return true;
    }
    if (path === '/admin/demos' || path.startsWith('/admin/demos/')) {
      return true;
    }
    if (/^\/agents\/[^/]+\/(persona|knowledge|runbooks)(\/|$)/.test(path)) {
      return true;
    }
    return false;
  });
}

const MCP_ORIGIN_ICON_PATHS = new Set([
  '/favicon.ico',
  '/icon',
  '/icon.svg',
  '/icon.png',
  '/apple-icon',
  '/apple-icon.png',
  '/apple-touch-icon',
  '/apple-touch-icon.png'
]);

function isAuthEntryPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/auth/login' ||
    pathname === '/auth/signup'
  );
}

function signedInHomePath(): string {
  return isOssDeploymentRequest() ? '/organization/overview' : '/overview';
}

export function proxy(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;

  // Signed-in visits to the app origin (and login/signup) must never paint
  // the login card first. Cookie presence is enough — the dashboard shell
  // still validates the session and sends unfinished onboarding home.
  if (isAuthEntryPath(pathname) && hasSessionCookie(request)) {
    const invitation = request.nextUrl.searchParams.get('invitation');
    if (pathname === '/auth/signup' && invitation) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-pathname', pathname);
      return NextResponse.next({
        request: { headers: requestHeaders }
      });
    }
    return NextResponse.redirect(new URL(signedInHomePath(), request.url));
  }

  // Cursor scrapes these well-known paths on the MCP origin and ignores
  // serverInfo.icons. Serve the landing favicon tile — not leftover aliases.
  if (MCP_ORIGIN_ICON_PATHS.has(pathname)) {
    const response = NextResponse.rewrite(new URL('/favicon.svg', request.url));
    response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    return response;
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

    const loginUrl = new URL('/auth/login', request.url);
    const callbackPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    const persistCallback = !isDefaultSignedInHome(pathname);

    if (persistCallback) {
      loginUrl.searchParams.set('callbackUrl', callbackPath);
    }

    const response = NextResponse.redirect(loginUrl);
    if (persistCallback) {
      const isSecure = requestIsHttps(request);
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
    }
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  return NextResponse.next({
    request: { headers: requestHeaders }
  });
}

export const config = {
  matcher: [
    '/',
    '/auth/login',
    '/auth/signup',
    '/favicon.ico',
    '/organization',
    '/organization/:path*',
    '/agents/:path*',
    '/desk/:path*',
    '/overview',
    '/inbox/:path*',
    '/tasks',
    '/tasks/:path*',
    '/calendar',
    '/calendar/:path*',
    '/resources',
    '/resources/:path*',
    '/integrations/:path*',
    '/settings/:path*',
    '/history',
    '/analytics',
    '/knowledge',
    '/human-desk/:path*',
    '/training',
    '/onboarding',
    '/onboarding/:path*',
    '/admin/:path*',
    '/workspace',
    '/dashboard/:path*',
    // Cookie presence gate for authenticated dashboard APIs (routes still validate session).
    '/api/dashboard/:path*'
  ]
};
