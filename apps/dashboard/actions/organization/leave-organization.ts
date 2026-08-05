'use server';

import { revalidatePath } from 'next/cache';
import { WorkspaceRole } from '@prisma/client';

import { authActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { recordAuditEvent } from '@/lib/audit/record-audit-event';
import { prisma } from '@/lib/db/prisma';
import {
  ForbiddenError,
  NotFoundError,
  PreConditionError
} from '@/lib/validation/exceptions';
import { leaveOrganizationSchema } from '@/schemas/organization/leave-organization-schema';

export const leaveOrganization = authActionClient
  .metadata({ actionName: 'leaveOrganization' })
  .schema(leaveOrganizationSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    if (!parsedInput.statement) {
      throw new PreConditionError('Confirmation is required.');
    }

    const organizationId = session.user.organizationId;

    const membership = await prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId
        }
      },
      select: {
        id: true,
        workspaceRole: true,
        organization: { select: { name: true } }
      }
    });

    if (!membership) {
      throw new NotFoundError('You are not a member of this workspace.');
    }

    if (membership.workspaceRole === WorkspaceRole.OWNER) {
      throw new ForbiddenError(
        'Workspace owners must delete the workspace instead of leaving.'
      );
    }

    await recordAuditEvent({
      organizationId,
      eventType: 'member.left',
      actorId: session.user.id,
      actorEmail: session.user.email,
      resourceType: 'user',
      resourceId: session.user.id,
      before: {
        email: session.user.email,
        workspaceRole: membership.workspaceRole,
        organizationName: membership.organization.name
      }
    });

    const alternate = await prisma.organizationMembership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: { not: organizationId }
      },
      select: { organizationId: true, workspaceRole: true, allowedPages: true },
      orderBy: { createdAt: 'asc' }
    });

    await prisma.$transaction(async (tx) => {
      await tx.organizationMembership.delete({
        where: { id: membership.id }
      });

      await tx.user.update({
        where: { id: session.user.id },
        data: alternate
          ? {
              organizationId: alternate.organizationId,
              workspaceRole: alternate.workspaceRole,
              allowedPages: alternate.allowedPages
            }
          : {
              organizationId: null
            }
      });
    });

    revalidatePath(Routes.Home);
    revalidatePath(Routes.NoWorkspace);
    revalidatePath(Routes.OrganizationInformation);

    return {
      redirectTo: alternate ? Routes.Home : Routes.NoWorkspace
    };
  });
