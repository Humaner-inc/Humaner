'use server';

import { cookies } from 'next/headers';

import { actionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { signIn } from '@/lib/auth';
import {
  getSafeAuthCallbackUrl,
  toOAuthSignInRedirect
} from '@/lib/auth/callback-url';
import { AuthCookies } from '@/lib/auth/cookies';
import { IdentityProvider } from '@/types/identity-provider';

export const continueWithGoogle = actionClient
  .metadata({ actionName: 'continueWithGoogle' })
  .action(async () => {
    const cookieStore = await cookies();
    const fallbackRedirect = getSafeAuthCallbackUrl(
      cookieStore.get(AuthCookies.CallbackUrl)?.value,
      Routes.Home
    );

    // Must use redirect: false inside Safe Actions — Auth.js redirect() is
    // swallowed as a serverError ("Couldn't continue with Google").
    const result = await signIn(
      IdentityProvider.Google,
      {
        redirectTo: fallbackRedirect,
        redirect: false
      },
      {
        // Google only accepts none | consent | select_account (not "login").
        prompt: 'select_account'
      }
    );

    return {
      redirectTo: toOAuthSignInRedirect(result, fallbackRedirect)
    };
  });
