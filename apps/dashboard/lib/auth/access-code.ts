import 'server-only';

import { timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

import { AUTH_ACCESS_CODE_LENGTH } from '@/lib/auth/access-code-constants';
import { AuthCookies } from '@/lib/auth/cookies';

export { AUTH_ACCESS_CODE_LENGTH } from '@/lib/auth/access-code-constants';

/** Default invite code while the gate is on. Override with AUTH_ACCESS_CODE. */
const DEFAULT_AUTH_ACCESS_CODE = 'earlyaccess';

const ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const ACCESS_COOKIE_VALUE = '1';

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Gate is on unless AUTH_ACCESS_GATE=off.
 * Code: AUTH_ACCESS_CODE (must be 11 chars) or default `earlyaccess`.
 */
export function isAuthAccessGateEnabled(): boolean {
  return process.env.AUTH_ACCESS_GATE !== 'off';
}

export function getExpectedAuthAccessCode(): string {
  const fromEnv = process.env.AUTH_ACCESS_CODE?.trim();
  if (fromEnv && fromEnv.length === AUTH_ACCESS_CODE_LENGTH) {
    return fromEnv;
  }
  return DEFAULT_AUTH_ACCESS_CODE;
}

export function normalizeAuthAccessCode(raw: string): string {
  return raw.trim();
}

export function isValidAuthAccessCode(raw: string): boolean {
  const code = normalizeAuthAccessCode(raw);
  if (code.length !== AUTH_ACCESS_CODE_LENGTH) {
    return false;
  }
  return safeEqual(code, getExpectedAuthAccessCode());
}

export async function hasAuthAccessUnlock(): Promise<boolean> {
  if (!isAuthAccessGateEnabled()) {
    return true;
  }
  const cookieStore = await cookies();
  return (
    cookieStore.get(AuthCookies.AuthAccessUnlock)?.value === ACCESS_COOKIE_VALUE
  );
}

export async function requireAuthAccessUnlock(): Promise<void> {
  if (await hasAuthAccessUnlock()) {
    return;
  }
  throw new Error('Early access code required.');
}

export async function grantAuthAccessUnlock(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AuthCookies.AuthAccessUnlock, ACCESS_COOKIE_VALUE, {
    httpOnly: true,
    secure: AuthCookies.isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
    ...(AuthCookies.domain ? { domain: AuthCookies.domain } : {})
  });
}
