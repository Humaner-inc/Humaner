'use server';

import { clearAuthCallbackUrl } from '@/actions/auth/clear-auth-callback-url';
import { actionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { signOut } from '@/lib/auth';
import { logOutSchema } from '@/schemas/auth/log-out-schema';

export const logOut = actionClient
  .metadata({ actionName: 'logOut' })
  .schema(logOutSchema)
  .action(async ({ parsedInput }) => {
    // Clear before signOut — Auth.js redirect:true never returns here, and a
    // stale callback cookie of /overview was leaving login stuck on that URL.
    await clearAuthCallbackUrl();

    await signOut({ redirect: false });

    return {
      redirectTo: parsedInput.redirect ? Routes.Login : undefined
    };
  });
