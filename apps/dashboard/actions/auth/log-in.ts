'use server';

import { cookies } from 'next/headers';
import { CredentialsSignin } from 'next-auth';
import { returnValidationErrors } from 'next-safe-action';

import { actionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { signIn } from '@/lib/auth';
import { AuthCookies } from '@/lib/auth/cookies';
import { passThroughlogInSchema } from '@/schemas/auth/log-in-schema';
import { IdentityProvider } from '@/types/identity-provider';

export const logIn = actionClient
  .metadata({ actionName: 'login' })
  .schema(passThroughlogInSchema)
  .action(async ({ parsedInput }) => {
    const cookieStore = await cookies();
    const callbackUrl =
      cookieStore.get(AuthCookies.CallbackUrl)?.value || Routes.Home;

    // Expected UX for logins is to pass the login credentials through
    // and not validate them on the client-side.
    try {
      await signIn(IdentityProvider.Credentials, {
        ...parsedInput,
        redirectTo: callbackUrl,
        redirect: true
      });
    } catch (e) {
      if (e instanceof CredentialsSignin) {
        return returnValidationErrors(passThroughlogInSchema, {
          _errors: [e.code]
        });
      }
      throw e;
    }
  });
