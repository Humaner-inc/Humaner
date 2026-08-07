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
import { reassertSessionCookieForUser } from '@/lib/auth/reassert-session-cookie';
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

      // Auth.js cookie writes from Server Actions are unreliable — reassert
      // the DB session onto the response the same way password login does.
      if (process.env.AUTH_SECRET) {
        try {
          const userId = symmetricDecrypt(
            parsedInput.token,
            process.env.AUTH_SECRET
          );
          await reassertSessionCookieForUser(userId);
        } catch {
          // Session was still created in the signIn callback; client redirect
          // may still succeed if Auth.js set the cookie.
        }
      }

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
