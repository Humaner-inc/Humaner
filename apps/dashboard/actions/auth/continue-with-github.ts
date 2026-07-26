'use server';

import { cookies } from 'next/headers';

import { actionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { signIn } from '@/lib/auth';
import { getSafeAuthCallbackUrl } from '@/lib/auth/callback-url';
import { AuthCookies } from '@/lib/auth/cookies';
import { IdentityProvider } from '@/types/identity-provider';

export const continueWithGitHub = actionClient
  .metadata({ actionName: 'continueWithGitHub' })
  .action(async () => {
    const cookieStore = await cookies();
    const redirectTo = getSafeAuthCallbackUrl(
      cookieStore.get(AuthCookies.CallbackUrl)?.value,
      Routes.Home
    );

    // GitHub OAuth does not use OIDC `prompt`; keep authorization params empty
    // so Auth.js uses the provider default scope (read:user user:email).
    await signIn(IdentityProvider.GitHub, {
      redirectTo
    });
  });
