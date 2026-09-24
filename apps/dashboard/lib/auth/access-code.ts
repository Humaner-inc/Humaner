import 'server-only';

import { timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

import {
  AUTH_ACCESS_CODE_LENGTH,
  resolveAuthAccessCode
} from '@/lib/auth/access-code-constants';
import { AuthCookies } from '@/lib/auth/cookies';
import {
  consumeUnusedViralBetaAccessCode,
  rememberSubmittedAccessCode
} from '@/lib/auth/viral-beta';

export { AUTH_ACCESS_CODE_LENGTH } from '@/lib/auth/access-code-constants';

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
 * Early Access code wall is off. Login and signup are the normal forms.
 * Reusable seed and one-time share codes stay in place for the follow step.
 */
export function isAuthAccessGateEnabled(): boolean {
  return false;
}

export function getExpectedAuthAccessCode(): string {
  return resolveAuthAccessCode();
}

export function normalizeAuthAccessCode(raw: string): string {
  return raw.trim();
}

export async function redeemAuthAccessCode(raw: string): Promise<boolean> {
  const code = normalizeAuthAccessCode(raw);
  if (code.length !== AUTH_ACCESS_CODE_LENGTH) {
    return false;
  }

  const genesis = getExpectedAuthAccessCode();
  if (safeEqual(code, genesis)) {
    await rememberSubmittedAccessCode(code);
    return true;
  }

  const consumed = await consumeUnusedViralBetaAccessCode(code, genesis);
  if (!consumed) {
    return false;
  }
  await rememberSubmittedAccessCode(code);
  return true;
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
