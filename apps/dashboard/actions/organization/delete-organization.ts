'use server';

import { revalidatePath } from 'next/cache';

import { ownerActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { recordAuditEvent } from '@/lib/audit/record-audit-event';
import { deleteOrganizationData } from '@/lib/data-retention/delete-organization';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError, PreConditionError } from '@/lib/validation/exceptions';
import { deleteOrganizationSchema } from '@/schemas/organization/delete-organization-schema';

export const deleteOrganization = ownerActionClient
  .metadata({ actionName: 'deleteOrganization' })
  .schema(deleteOrganizationSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    if (!parsedInput.statement) {
      throw new PreConditionError('Confirmation is required.');
    }

    const organizationId = session.user.organizationId;

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true }
    });

    if (!organization) {
      throw new NotFoundError('Workspace not found.');
    }

    if (parsedInput.name.trim() !== organization.name) {
      throw new PreConditionError('Workspace name does not match.');
    }

    await recordAuditEvent({
      organizationId,
      eventType: 'workspace.deleted',
      actorId: session.user.id,
      actorEmail: session.user.email,
      resourceType: 'organization',
      resourceId: organizationId,
      before: { name: organization.name }
    });

    await deleteOrganizationData(organizationId);

    const remainingMembership = await prisma.organizationMembership.findFirst({
      where: { userId: session.user.id },
      select: { organizationId: true },
      orderBy: { createdAt: 'asc' }
    });

    revalidatePath(Routes.Home);
    revalidatePath(Routes.NoWorkspace);
    revalidatePath(Routes.OrganizationInformation);

    return {
      redirectTo: remainingMembership ? Routes.Home : Routes.NoWorkspace
    };
  });
