'use server';

import { cookies } from 'next/headers';
import { CredentialsSignin } from 'next-auth';
import { returnValidationErrors } from 'next-safe-action';

import { actionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { signIn } from '@/lib/auth';
import {
  getSafeAuthCallbackUrl,
  toClientAuthRedirect
} from '@/lib/auth/callback-url';
import { AuthCookies } from '@/lib/auth/cookies';
import { symmetricDecrypt } from '@/lib/auth/encryption';
import { forceSessionCookieForUser } from '@/lib/auth/reassert-session-cookie';
import { submitRecoveryCodeSchema } from '@/schemas/auth/submit-recovery-code-schema';
import { IdentityProvider } from '@/types/identity-provider';

export const submitRecoveryCode = actionClient
  .metadata({ actionName: 'submitRecoveryCode' })
  .schema(submitRecoveryCodeSchema)
  .action(async ({ parsedInput }) => {
    const cookieStore = await cookies();
    const fallbackRedirect = getSafeAuthCallbackUrl(
      cookieStore.get(AuthCookies.CallbackUrl)?.value,
      Routes.Home
    );

    try {
      const result = await signIn(IdentityProvider.RecoveryCode, {
        ...parsedInput,
        redirectTo: fallbackRedirect,
        redirect: false
      });

      if (!process.env.AUTH_SECRET) {
        throw new Error(
          'AUTH_SECRET is required to complete recovery sign-in.'
        );
      }
      const userId = symmetricDecrypt(
        parsedInput.token,
        process.env.AUTH_SECRET
      );
      await forceSessionCookieForUser(userId);

      return { redirectTo: toClientAuthRedirect(result, fallbackRedirect) };
    } catch (e) {
      if (e instanceof CredentialsSignin) {
        return returnValidationErrors(submitRecoveryCodeSchema, {
          _errors: [e.code]
        });
      }
      throw e;
    }
  });
