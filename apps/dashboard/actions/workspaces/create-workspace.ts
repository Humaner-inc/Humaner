'use server';

import { revalidatePath } from 'next/cache';

import { authenticatedActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { createWorkspaceForUser } from '@/lib/auth/workspace-membership';
import { PreConditionError } from '@/lib/validation/exceptions';
import { createWorkspaceSchema } from '@/schemas/workspaces/workspace-schemas';

export const createWorkspace = authenticatedActionClient
  .metadata({ actionName: 'createWorkspace' })
  .schema(createWorkspaceSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    if (!session.user.email) {
      throw new PreConditionError('Email is missing.');
    }

    await createWorkspaceForUser({
      userId: session.user.id,
      email: session.user.email,
      website: parsedInput.website
    });

    revalidatePath(Routes.Home);
    revalidatePath(Routes.Onboarding);
    revalidatePath(Routes.NoWorkspace);

    return { redirectTo: Routes.Onboarding };
  });
