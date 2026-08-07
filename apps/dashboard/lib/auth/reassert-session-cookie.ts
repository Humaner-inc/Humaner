import 'server-only';

import { cookies } from 'next/headers';

import { adapter } from '@/lib/auth/adapter';
import { AuthCookies } from '@/lib/auth/cookies';
import {
  generateSessionToken,
  getSessionExpiryFromNow
} from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

/** Auth.js may leave chunked JWT leftovers (`name.0`, `name.1`, …). */
const SESSION_COOKIE_CHUNK_INDEXES = [0, 1, 2, 3, 4] as const;

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
 * Clear host-only + shared-domain session cookies, including Auth.js chunks.
 * Chunk leftovers + a fresh UUID cookie join into a corrupt session token.
 */
export async function clearSessionCookies(): Promise<void> {
  const cookieStore = await cookies();
  const base = AuthCookies.SessionToken;
  const names = [
    base,
    ...SESSION_COOKIE_CHUNK_INDEXES.map((i) => `${base}.${i}`)
  ];

  for (const name of names) {
    // Host-only (no Domain) — Auth.js / older deploys may have written these.
    cookieStore.set(name, '', expiredCookieOptions());
    if (AuthCookies.domain) {
      cookieStore.set(name, '', expiredCookieOptions(AuthCookies.domain));
    }
  }
}

/** Write the canonical database session cookie after clearing leftovers. */
export async function writeSessionCookie(
  sessionToken: string,
  expires: Date
): Promise<void> {
  await clearSessionCookies();

  const cookieStore = await cookies();
  cookieStore.set({
    name: AuthCookies.SessionToken,
    value: sessionToken,
    ...AuthCookies.sessionCookieOptions(expires)
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
