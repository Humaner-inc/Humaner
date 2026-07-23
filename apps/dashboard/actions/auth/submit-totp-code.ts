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
import { submitTotpCodeSchema } from '@/schemas/auth/submit-totp-code-schema';
import { IdentityProvider } from '@/types/identity-provider';

export const submitTotpCode = actionClient
  .metadata({ actionName: 'submitTotpCode' })
  .schema(submitTotpCodeSchema)
  .action(async ({ parsedInput }) => {
    const cookieStore = await cookies();
    const fallbackRedirect = getSafeAuthCallbackUrl(
      cookieStore.get(AuthCookies.CallbackUrl)?.value,
      Routes.Home
    );

    try {
      const result = await signIn(IdentityProvider.TotpCode, {
        ...parsedInput,
        redirectTo: fallbackRedirect,
        redirect: false
      });

      return { redirectTo: toClientAuthRedirect(result, fallbackRedirect) };
    } catch (e) {
      if (e instanceof CredentialsSignin) {
        return returnValidationErrors(submitTotpCodeSchema, {
          _errors: [e.code]
        });
      }
      throw e;
    }
  });
