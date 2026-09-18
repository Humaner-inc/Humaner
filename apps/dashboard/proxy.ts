import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import {
  expireParentDomainSessionSetCookies,
  expireSessionChunkSetCookies,
  isOpaqueSessionToken,
  sanitizeSessionCookieHeader,
  SESSION_COOKIE_BASE_NAMES
} from '@/lib/auth/session-cookie-header';
import { isProtectedAppPath } from '@/lib/routes/public-pathname';

function requestIsHttps(request: NextRequest): boolean {
  const forwarded = request.headers.get('x-forwarded-proto');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() === 'https';
  }
  if (request.nextUrl.protocol === 'https:') {
    return true;
  }
  const host = (
    request.headers.get('x-forwarded-host') ?? request.nextUrl.hostname
  ).toLowerCase();
  return host === 'humaner.io' || host.endsWith('.humaner.io');
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

function isAuthJsRoute(pathname: string): boolean {
  return pathname === '/api/auth' || pathname.startsWith('/api/auth/');
}

/**
 * Cookie presence must not depend solely on `headers.get('cookie')` — Next.js
 * proxy can omit that header while still exposing values on `request.cookies`.
 * v1.1 bounced every login because the sanitizer then saw an empty header.
 */
function hasOpaqueSessionCookie(
  request: NextRequest,
  sanitizedToken: string | null
): boolean {
  if (sanitizedToken && isOpaqueSessionToken(sanitizedToken)) {
    return true;
  }
  for (const name of SESSION_COOKIE_BASE_NAMES) {
    for (const cookie of request.cookies.getAll(name)) {
      if (cookie.value && isOpaqueSessionToken(cookie.value)) {
        return true;
      }
    }
  }
  return false;
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

function expirePoisonedSessionCookies(
  request: NextRequest,
  response: NextResponse,
  droppedChunkNames: string[]
): NextResponse {
  const isSecure = requestIsHttps(request);
  const domain = sharedCookieDomain(request.nextUrl.hostname);

  if (droppedChunkNames.length > 0) {
    const chunkBases = new Set<string>(SESSION_COOKIE_BASE_NAMES);
    for (const name of droppedChunkNames) {
      const base = SESSION_COOKIE_BASE_NAMES.find((candidate) =>
        name.startsWith(`${candidate}.`)
      );
      if (base) {
        chunkBases.add(base);
      }
    }
    for (const base of chunkBases) {
      for (const header of expireSessionChunkSetCookies(base, {
        secure: isSecure,
        domain
      })) {
        response.headers.append('Set-Cookie', header);
      }
    }
  }

  // Always drop leftover Domain=.humaner.io session cookies. cookies().set()
  // cannot emit two Set-Cookie headers for the same name, so login cannot
  // clear the parent-domain copy itself — this is the production cleanup.
  if (domain) {
    for (const header of expireParentDomainSessionSetCookies({
      secure: isSecure,
      domain
    })) {
      response.headers.append('Set-Cookie', header);
    }
  }

  return response;
}

export function proxy(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;
  const rawCookieHeader = request.headers.get('cookie');
  const sanitized = sanitizeSessionCookieHeader(
    rawCookieHeader,
    SESSION_COOKIE_BASE_NAMES
  );
  const requestHeaders = new Headers(request.headers);
  // Never rewrite cookies on Auth.js routes — CSRF / PKCE / state live there.
  // Also never delete a Cookie header we could not read (Next may omit it).
  if (
    !isAuthJsRoute(pathname) &&
    rawCookieHeader &&
    sanitized.cookieHeader !== rawCookieHeader
  ) {
    if (sanitized.cookieHeader) {
      requestHeaders.set('cookie', sanitized.cookieHeader);
    } else {
      requestHeaders.delete('cookie');
    }
  }
  const hasSessionCookie = hasOpaqueSessionCookie(
    request,
    sanitized.sessionToken
  );
  const expire = (response: NextResponse): NextResponse =>
    expirePoisonedSessionCookies(
      request,
      response,
      sanitized.droppedChunkNames
    );

  if (pathname === '/favicon.ico') {
    return NextResponse.rewrite(new URL('/favicon.svg', request.url));
  }

  // Self-Host: Polar billing + Cloud inbox are not part of the kit.
  // Prefer rewrite for RSC so App Router flight stays valid; redirect for
  // full document navigations.
  if (isOssDeploymentRequest() && isOssBlockedPath(pathname)) {
    if (isRscNavigationRequest(request)) {
      return expire(
        NextResponse.rewrite(new URL('/dashboard/home', request.url))
      );
    }
    return expire(
      NextResponse.redirect(new URL('/organization/overview', request.url))
    );
  }

  // Server Actions POST to the current page URL. An HTML login redirect here
  // returns text/html instead of an RSC payload and surfaces as
  // "An unexpected response was received from the server."
  const isServerAction = request.headers.has('next-action');

  if (isProtectedAppPath(pathname) && !isServerAction && !hasSessionCookie) {
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
    return expire(response);
  }

  requestHeaders.set('x-pathname', pathname);
  return expire(
    NextResponse.next({
      request: { headers: requestHeaders }
    })
  );
}

export const config = {
  matcher: [
    '/favicon.ico',
    '/organization',
    '/organization/:path*',
    '/agents/:path*',
    '/desk/:path*',
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
    // Expire leftover parent-domain / JWT session cookies on auth pages.
    // Do not rewrite the incoming Cookie header on /api/auth (CSRF / PKCE).
    '/auth/:path*',
    '/api/auth/:path*',
    // Cookie presence gate for authenticated dashboard APIs (routes still validate session).
    '/api/dashboard/:path*'
  ]
};
