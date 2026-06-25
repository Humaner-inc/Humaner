'use server';

import { cookies } from 'next/headers';
import { CredentialsSignin } from 'next-auth';
import { returnValidationErrors } from 'next-safe-action';

import { actionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { signIn } from '@/lib/auth';
import { AuthCookies } from '@/lib/auth/cookies';
import { submitTotpCodeSchema } from '@/schemas/auth/submit-totp-code-schema';
import { IdentityProvider } from '@/types/identity-provider';

export const submitTotpCode = actionClient
  .metadata({ actionName: 'submitTotpCode' })
  .schema(submitTotpCodeSchema)
  .action(async ({ parsedInput }) => {
    const cookieStore = await cookies();
    const callbackUrl =
      cookieStore.get(AuthCookies.CallbackUrl)?.value || Routes.Home;

    try {
      await signIn(IdentityProvider.TotpCode, {
        ...parsedInput,
        redirectTo: callbackUrl,
        redirect: true
      });
    } catch (e) {
      if (e instanceof CredentialsSignin) {
        return returnValidationErrors(submitTotpCodeSchema, {
          _errors: [e.code]
        });
      }
      throw e;
    }
  });
