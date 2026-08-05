'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { authenticatedActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { PreConditionError } from '@/lib/validation/exceptions';

const requestWorkspaceAccessSchema = z.object({
  workspaceId: z.string().trim().uuid('Enter a valid workspace ID.')
});

export const requestWorkspaceAccess = authenticatedActionClient
  .metadata({ actionName: 'requestWorkspaceAccess' })
  .schema(requestWorkspaceAccessSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organization = await prisma.organization.findFirst({
      where: {
        id: parsedInput.workspaceId,
        completedOnboarding: true
      },
      select: { id: true, name: true }
    });
    if (!organization) {
      throw new PreConditionError(
        'No workspace found for that ID. Ask your admin for the workspace ID or an invite.'
      );
    }

    const existingMembership = await prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: organization.id
        }
      },
      select: { id: true }
    });
    if (existingMembership) {
      throw new PreConditionError('You already belong to this workspace.');
    }

    await prisma.workspaceJoinRequest.upsert({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: organization.id
        }
      },
      create: {
        userId: session.user.id,
        organizationId: organization.id,
        status: 'PENDING'
      },
      update: {
        status: 'PENDING'
      }
    });

    revalidatePath(Routes.NoWorkspace);
    return { organizationName: organization.name };
  });
