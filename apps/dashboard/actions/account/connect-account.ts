'use server';

import { revalidatePath } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { signIn } from '@/lib/auth';
import { connectAccountSchema } from '@/schemas/account/connect-account-schema';

export const connectAccount = authActionClient
  .metadata({ actionName: 'connectAccount' })
  .schema(connectAccountSchema)
  .action(async ({ parsedInput }) => {
    await signIn(
      parsedInput.provider,
      {},
      {
        prompt: 'login'
      }
    );

    revalidatePath(Routes.Security);
  });
