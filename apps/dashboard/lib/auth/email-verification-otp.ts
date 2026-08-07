import 'server-only';

import {
  EMAIL_OTP_LENGTH,
  EMAIL_VERIFICATION_MAX_ATTEMPTS_PER_HOUR,
  EMAIL_VERIFICATION_MAX_RESENDS_PER_HOUR
} from '@/constants/limits';
import { rateLimit } from '@/lib/network/rate-limit';
import { PreConditionError } from '@/lib/validation/exceptions';

const verifyLimiter = rateLimit({ intervalInMs: 60 * 60 * 1000 });
const resendLimiter = rateLimit({ intervalInMs: 60 * 60 * 1000 });

/** Cryptographically random numeric OTP (default 6 digits). */
export function generateEmailVerificationOtp(
  length: number = EMAIL_OTP_LENGTH
): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => String(byte % 10)).join('');
}

export function assertEmailVerificationVerifyRateLimit(email: string): void {
  const { isRateLimited } = verifyLimiter.check(
    EMAIL_VERIFICATION_MAX_ATTEMPTS_PER_HOUR,
    `email-verify:${email.toLowerCase()}`
  );
  if (isRateLimited) {
    throw new PreConditionError(
      'Too many verification attempts. Try again in about an hour.'
    );
  }
}

export function assertEmailVerificationResendRateLimit(email: string): void {
  const { isRateLimited } = resendLimiter.check(
    EMAIL_VERIFICATION_MAX_RESENDS_PER_HOUR,
    `email-resend:${email.toLowerCase()}`
  );
  if (isRateLimited) {
    throw new PreConditionError(
      'Too many verification emails requested. Try again in about an hour.'
    );
  }
}
