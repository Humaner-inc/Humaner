'use server';

import { actionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { signOut } from '@/lib/auth';
import { logOutSchema } from '@/schemas/auth/log-out-schema';

export const logOut = actionClient
  .metadata({ actionName: 'logOut' })
  .schema(logOutSchema)
  .action(async ({ parsedInput }) => {
    return await signOut({
      redirect: parsedInput.redirect,
      redirectTo: parsedInput.redirect ? Routes.Logout : undefined
    });
  });
