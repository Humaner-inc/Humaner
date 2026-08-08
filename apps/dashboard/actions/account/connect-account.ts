'use server';

import { revalidatePath } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { signIn } from '@/lib/auth';
import { toOAuthSignInRedirect } from '@/lib/auth/callback-url';
import { connectAccountSchema } from '@/schemas/account/connect-account-schema';
import { OAuthIdentityProvider } from '@/types/identity-provider';

export const connectAccount = authActionClient
  .metadata({ actionName: 'connectAccount' })
  .schema(connectAccountSchema)
  .action(async ({ parsedInput }) => {
    const authorizationParams =
      parsedInput.provider === OAuthIdentityProvider.Google
        ? { prompt: 'select_account' }
        : undefined;

    const result = await signIn(
      parsedInput.provider,
      {
        redirectTo: Routes.Security,
        redirect: false
      },
      authorizationParams
    );

    revalidatePath(Routes.Security);

    return {
      redirectTo: toOAuthSignInRedirect(result, Routes.Security)
    };
  });
