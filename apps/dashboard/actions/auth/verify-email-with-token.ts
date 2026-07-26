'use server';

import { CredentialsSignin } from 'next-auth';

import { actionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { completeEmailVerification } from '@/lib/auth/complete-email-verification';
import { signInAfterEmailVerification } from '@/lib/auth/sign-in-after-email-verification';
import { verifyEmailWithTokenSchema } from '@/schemas/auth/verify-email-with-token-schema';

export const verifyEmailWithToken = actionClient
  .metadata({ actionName: 'verifyEmailWithToken' })
  .schema(verifyEmailWithTokenSchema)
  .action(async ({ parsedInput }) => {
    const result = await completeEmailVerification({
      type: 'token',
      token: parsedInput.token
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
