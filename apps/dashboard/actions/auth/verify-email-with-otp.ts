'use server';

import { CredentialsSignin } from 'next-auth';

import { actionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { completeEmailVerification } from '@/lib/auth/complete-email-verification';
import { assertEmailVerificationVerifyRateLimit } from '@/lib/auth/email-verification-otp';
import { signInAfterEmailVerification } from '@/lib/auth/sign-in-after-email-verification';
import { verifyEmailWithOtpSchema } from '@/schemas/auth/verify-email-with-otp-schema';

export const verifyEmailWithOtp = actionClient
  .metadata({ actionName: 'verifyEmailWithOtp' })
  .schema(verifyEmailWithOtpSchema)
  .action(async ({ parsedInput }) => {
    const normalizedEmail = parsedInput.email.toLowerCase();
    assertEmailVerificationVerifyRateLimit(normalizedEmail);

    const result = await completeEmailVerification({
      type: 'otp',
      otp: parsedInput.otp,
      email: normalizedEmail
    });

    if (result.kind === 'redirect') {
      return { redirectTo: result.redirectTo };
    }

    try {
      const redirectTo = await signInAfterEmailVerification(result.handshake);
      return { redirectTo };
    } catch (error) {
      if (error instanceof CredentialsSignin) {
        return { redirectTo: Routes.Login };
      }
      throw error;
    }
  });
