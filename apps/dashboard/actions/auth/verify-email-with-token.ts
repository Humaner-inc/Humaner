'use server';

import { actionClient } from '@/actions/safe-action';
import { completeEmailVerification } from '@/lib/auth/complete-email-verification';
import { verifyEmailWithTokenSchema } from '@/schemas/auth/verify-email-with-token-schema';

export const verifyEmailWithToken = actionClient
  .metadata({ actionName: 'verifyEmailWithToken' })
  .schema(verifyEmailWithTokenSchema)
  .action(async ({ parsedInput }) => {
    const { redirectTo } = await completeEmailVerification({
      type: 'token',
      token: parsedInput.token
    });

    return { redirectTo };
  });
