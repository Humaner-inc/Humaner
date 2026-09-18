'use server';

import { cookies } from 'next/headers';
import { CredentialsSignin } from 'next-auth';
import { returnValidationErrors } from 'next-safe-action';

import { actionClient } from '@/actions/safe-action';
import { signIn } from '@/lib/auth';
import {
  getSafeAuthCallbackUrl,
  toClientAuthRedirect
} from '@/lib/auth/callback-url';
import { AuthCookies } from '@/lib/auth/cookies';
import { symmetricDecrypt } from '@/lib/auth/encryption';
import { forceSessionCookieForUser } from '@/lib/auth/reassert-session-cookie';
import { submitTotpCodeSchema } from '@/schemas/auth/submit-totp-code-schema';
import { IdentityProvider } from '@/types/identity-provider';

export const submitTotpCode = actionClient
  .metadata({ actionName: 'submitTotpCode' })
  .schema(submitTotpCodeSchema)
  .action(async ({ parsedInput }) => {
    const cookieStore = await cookies();
    const fallbackRedirect = getSafeAuthCallbackUrl(
      cookieStore.get(AuthCookies.CallbackUrl)?.value
    );

    try {
      const result = await signIn(IdentityProvider.TotpCode, {
        ...parsedInput,
        redirectTo: fallbackRedirect,
        redirect: false
      });

      // Auth.js credentials + database sessions often leave a JWT / chunked
      // cookie that auth() cannot resolve — mint a clean DB session cookie.
      if (!process.env.AUTH_SECRET) {
        throw new Error(
          'AUTH_SECRET is required to complete two-factor sign-in.'
        );
      }
      const userId = symmetricDecrypt(
        parsedInput.token,
        process.env.AUTH_SECRET
      );
      await forceSessionCookieForUser(userId);

      return {
        redirectTo: toClientAuthRedirect(result, fallbackRedirect)
      };
    } catch (e) {
      if (e instanceof CredentialsSignin) {
        return returnValidationErrors(submitTotpCodeSchema, {
          _errors: [e.code]
        });
      }
      throw e;
    }
  });
