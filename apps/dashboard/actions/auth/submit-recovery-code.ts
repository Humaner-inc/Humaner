'use server';

import { cookies } from 'next/headers';
import { CredentialsSignin } from 'next-auth';
import { returnValidationErrors } from 'next-safe-action';

import { actionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { signIn } from '@/lib/auth';
import { getSafeAuthCallbackUrl } from '@/lib/auth/callback-url';
import { AuthCookies } from '@/lib/auth/cookies';
import { submitRecoveryCodeSchema } from '@/schemas/auth/submit-recovery-code-schema';
import { IdentityProvider } from '@/types/identity-provider';

export const submitRecoveryCode = actionClient
  .metadata({ actionName: 'submitRecoveryCode' })
  .schema(submitRecoveryCodeSchema)
  .action(async ({ parsedInput }) => {
    const cookieStore = await cookies();
    const redirectTo = getSafeAuthCallbackUrl(
      cookieStore.get(AuthCookies.CallbackUrl)?.value,
      Routes.Home
    );

    try {
      await signIn(IdentityProvider.RecoveryCode, {
        ...parsedInput,
        redirectTo,
        redirect: true
      });
    } catch (e) {
      if (e instanceof CredentialsSignin) {
        return returnValidationErrors(submitRecoveryCodeSchema, {
          _errors: [e.code]
        });
      }
      throw e;
    }
  });
