import { createHmac, timingSafeEqual } from 'node:crypto';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getUnsubscribeSecret(): string | undefined {
  return (
    process.env.WAITLIST_UNSUBSCRIBE_SECRET ??
    process.env.RESEND_API_KEY ??
    process.env.EMAIL_RESEND_API_KEY
  );
}

export function createUnsubscribeToken(email: string): string | null {
  const secret = getUnsubscribeSecret();

  if (!secret) {
    return null;
  }

  return createHmac('sha256', secret)
    .update(normalizeEmail(email))
    .digest('base64url');
}

export function verifyUnsubscribeToken(
  email: string,
  token: string
): boolean {
  const expected = createUnsubscribeToken(email);

  if (!expected || !token) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const tokenBuffer = Buffer.from(token);

  if (expectedBuffer.length !== tokenBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, tokenBuffer);
}
