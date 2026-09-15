'use server';

import { cookies } from 'next/headers';

import { actionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { signIn } from '@/lib/auth';
import {
  grantAuthAccessUnlock,
  requireAuthAccessUnlock
} from '@/lib/auth/access-code';
import {
  getSafeAuthCallbackUrl,
  toOAuthSignInRedirect
} from '@/lib/auth/callback-url';
import { AuthCookies } from '@/lib/auth/cookies';
import { IdentityProvider } from '@/types/identity-provider';

export const continueWithGitHub = actionClient
  .metadata({ actionName: 'continueWithGitHub' })
  .action(async () => {
    const cookieStore = await cookies();
    if (cookieStore.get(AuthCookies.SignUpInvitationId)?.value) {
      await grantAuthAccessUnlock();
    } else {
      await requireAuthAccessUnlock();
    }
    const fallbackRedirect = getSafeAuthCallbackUrl(
      cookieStore.get(AuthCookies.CallbackUrl)?.value,
      Routes.Home
    );

    // Must use redirect: false inside Safe Actions — Auth.js redirect() is
    // swallowed as a serverError ("Couldn't continue with GitHub").
    // GitHub OAuth does not use OIDC `prompt`; keep authorization params empty
    // so Auth.js uses the provider default scope (read:user user:email).
    const result = await signIn(IdentityProvider.GitHub, {
      redirectTo: fallbackRedirect,
      redirect: false
    });

    return {
      redirectTo: toOAuthSignInRedirect(result, fallbackRedirect)
    };
  });
