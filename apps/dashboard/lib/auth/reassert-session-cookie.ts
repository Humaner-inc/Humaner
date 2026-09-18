import 'server-only';

import { cookies } from 'next/headers';

import { adapter } from '@/lib/auth/adapter';
import { AuthCookies } from '@/lib/auth/cookies';
import {
  generateSessionToken,
  getSessionExpiryFromNow
} from '@/lib/auth/session';
import { SESSION_COOKIE_CHUNK_INDEXES } from '@/lib/auth/session-cookie-header';
import { prisma } from '@/lib/db/prisma';

function expiredCookieOptions(domain?: string): {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: '/';
  domain?: string;
  maxAge: 0;
  expires: Date;
} {
  return {
    httpOnly: true,
    secure: AuthCookies.isSecure,
    sameSite: 'lax',
    path: '/',
    ...(domain ? { domain } : {}),
    maxAge: 0,
    expires: new Date(0)
  };
}

/**
 * Clear host-only session cookies, including Auth.js chunks.
 * Parent-domain copies and leftover chunks are expired in middleware
 * (`headers.append`) because `cookies().set()` is keyed by name.
 */
export async function clearSessionCookies(): Promise<void> {
  const cookieStore = await cookies();
  const base = AuthCookies.SessionToken;
  const names = [
    base,
    ...SESSION_COOKIE_CHUNK_INDEXES.map((i) => `${base}.${i}`)
  ];

  for (const name of names) {
    cookieStore.set(name, '', expiredCookieOptions());
  }
}

/**
 * Write the canonical host-only database session cookie.
 * Do not delete the canonical name first — a Max-Age=0 and a new value
 * for the same name can race, and leftover JWT chunks are stripped in
 * middleware before Auth.js concatenates them.
 */
export async function writeSessionCookie(
  sessionToken: string,
  expires: Date
): Promise<void> {
  const cookieStore = await cookies();
  const base = AuthCookies.SessionToken;

  for (const index of SESSION_COOKIE_CHUNK_INDEXES) {
    cookieStore.set(`${base}.${index}`, '', expiredCookieOptions());
  }

  cookieStore.set({
    name: base,
    value: sessionToken,
    ...AuthCookies.hostOnlyCookieOptions(expires)
  });
}

/**
 * Ensure the session cookie on this Server Action response matches a live
 * DB session. Prefer the latest session; mint one if Auth.js failed to.
 */
export async function reassertSessionCookieForUser(
  userId: string
): Promise<void> {
  let latestSession = await prisma.session.findFirst({
    where: {
      userId,
      expires: { gt: new Date() }
    },
    orderBy: { expires: 'desc' },
    select: { sessionToken: true, expires: true }
  });

  if (!latestSession) {
    const sessionToken = generateSessionToken();
    const expires = getSessionExpiryFromNow();
    const created = await adapter.createSession!({
      sessionToken,
      userId,
      expires
    });
    if (!created) {
      return;
    }
    latestSession = { sessionToken, expires };
  }

  await writeSessionCookie(
    latestSession.sessionToken,
    latestSession.expires ?? getSessionExpiryFromNow()
  );
}

/**
 * Post-MFA: mint a fresh DB session and set a clean cookie so Auth.js JWT
 * chunks / mismatched tokens cannot bounce the user back to /auth/login.
 */
export async function forceSessionCookieForUser(userId: string): Promise<void> {
  const sessionToken = generateSessionToken();
  const expires = getSessionExpiryFromNow();

  const created = await adapter.createSession!({
    sessionToken,
    userId,
    expires
  });

  if (!created) {
    await reassertSessionCookieForUser(userId);
    return;
  }

  await writeSessionCookie(sessionToken, expires);
}
