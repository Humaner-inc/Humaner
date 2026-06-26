'use server';

import { revalidatePath } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { switchUserWorkspace } from '@/lib/auth/workspace-membership';
import { prisma } from '@/lib/db/prisma';
import { switchWorkspaceSchema } from '@/schemas/workspaces/workspace-schemas';

export const switchWorkspace = authActionClient
  .metadata({ actionName: 'switchWorkspace' })
  .schema(switchWorkspaceSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    await switchUserWorkspace({
      userId: session.user.id,
      organizationId: parsedInput.organizationId
    });

    revalidatePath(Routes.Home);
    revalidatePath(Routes.Dashboard);

    const organization = await prisma.organization.findFirst({
      where: { id: parsedInput.organizationId },
      select: { completedOnboarding: true }
    });

    return {
      redirectTo: organization?.completedOnboarding
        ? Routes.Home
        : Routes.Onboarding
    };
  });
