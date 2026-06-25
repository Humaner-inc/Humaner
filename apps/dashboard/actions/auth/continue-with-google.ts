'use server';

import { cookies } from 'next/headers';

import { actionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { signIn } from '@/lib/auth';
import { AuthCookies } from '@/lib/auth/cookies';
import { IdentityProvider } from '@/types/identity-provider';

export const continueWithGoogle = actionClient
  .metadata({ actionName: 'continueWithGoogle' })
  .action(async () => {
    const cookieStore = await cookies();
    const callbackUrl = cookieStore.get(AuthCookies.CallbackUrl)?.value;
    const redirectTo = callbackUrl ?? Routes.Home;

    await signIn(
      IdentityProvider.Google,
      {
        redirectTo
      },
      {
        prompt: 'login'
      }
    );
  });
