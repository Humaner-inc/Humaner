import { AUTH_ACCESS_CODE_LENGTH } from '@/lib/auth/access-code-constants';

/** Inbox is free for beta owners through the end of 29 Sep 2026 (two weeks from 15 Sep). */
export const VIRAL_BETA_INBOX_FREE_UNTIL = new Date('2026-09-29T23:59:59.999Z');

export const VIRAL_BETA_SHARE_CODE_COUNT = 2;
export const VIRAL_BETA_STARTER_CREDIT_CENTS = 1_000;
export const VIRAL_BETA_X_FOLLOW_CREDIT_CENTS = 1_000;
export const VIRAL_BETA_STARTER_CREDIT_USD =
  VIRAL_BETA_STARTER_CREDIT_CENTS / 100;
export const VIRAL_BETA_X_FOLLOW_CREDIT_USD =
  VIRAL_BETA_X_FOLLOW_CREDIT_CENTS / 100;

/** Readable 11-char alphabet — no 0/O/1/I/L. */
export const VIRAL_BETA_CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

export function isViralBetaInboxFree(now: Date = new Date()): boolean {
  return now.getTime() <= VIRAL_BETA_INBOX_FREE_UNTIL.getTime();
}

export function isViralBetaActive(
  expiresAt: Date | string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!expiresAt) {
    return false;
  }
  const expires = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(expires.getTime())) {
    return false;
  }
  return expires.getTime() > now.getTime();
}

export function formatViralBetaInboxFreeUntil(
  locale: string = 'en-US'
): string {
  return VIRAL_BETA_INBOX_FREE_UNTIL.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric'
  });
}

export function isViralBetaCodeFormat(code: string): boolean {
  return code.length === AUTH_ACCESS_CODE_LENGTH;
}

export function generateViralBetaAccessCode(
  random: (size: number) => Uint8Array = (size) => {
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    return bytes;
  }
): string {
  const alphabet = VIRAL_BETA_CODE_ALPHABET;
  const bytes = random(AUTH_ACCESS_CODE_LENGTH);
  let code = '';
  for (let i = 0; i < AUTH_ACCESS_CODE_LENGTH; i += 1) {
    code += alphabet[bytes[i]! % alphabet.length];
  }
  return code;
}
