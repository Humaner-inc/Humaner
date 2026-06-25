'use server';

import { actionClient } from '@/actions/safe-action';
import { completeEmailVerification } from '@/lib/auth/complete-email-verification';
import { verifyEmailWithOtpSchema } from '@/schemas/auth/verify-email-with-otp-schema';

export const verifyEmailWithOtp = actionClient
  .metadata({ actionName: 'verifyEmailWithOtp' })
  .schema(verifyEmailWithOtpSchema)
  .action(async ({ parsedInput }) => {
    const { redirectTo } = await completeEmailVerification({
      type: 'otp',
      otp: parsedInput.otp
    });

    return { redirectTo };
  });
