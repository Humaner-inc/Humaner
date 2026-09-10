import 'server-only';

import { purgeVisitorMemory } from '@/services/agent-memory';

import { prisma } from '@/lib/db/prisma';

async function purgeOrganizationVisitorMemory(
  organizationId: string
): Promise<void> {
  const conversations = await prisma.conversation.findMany({
    where: { agent: { organizationId } },
    select: { visitorId: true },
    distinct: ['visitorId']
  });

  for (const { visitorId } of conversations) {
    await purgeVisitorMemory(visitorId);
  }
}

/**
 * Before deleting a workspace, re-point users whose *active* workspace is this
 * org to another membership (or null). Prevents account loss for multi-workspace
 * members once FK is ON DELETE SET NULL.
 */
async function reassignActiveWorkspacePointers(
  organizationId: string,
  userIds: string[]
): Promise<void> {
  if (userIds.length === 0) {
    return;
  }

  for (const userId of userIds) {
    const alternate = await prisma.organizationMembership.findFirst({
      where: {
        userId,
        organizationId: { not: organizationId }
      },
      select: {
        organizationId: true,
        workspaceRole: true,
        allowedPages: true
      },
      orderBy: { createdAt: 'asc' }
    });

    await prisma.user.update({
      where: { id: userId },
      data: alternate
        ? {
            organizationId: alternate.organizationId,
            workspaceRole: alternate.workspaceRole,
            allowedPages: alternate.allowedPages
          }
        : { organizationId: null }
    });
  }
}

export async function deleteOrganizationData(
  organizationId: string
): Promise<void> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      ownerId: true,
      users: { select: { id: true } }
    }
  });

  if (!organization) {
    return;
  }

  await purgeOrganizationVisitorMemory(organizationId);

  await reassignActiveWorkspacePointers(
    organizationId,
    organization.users.map((user) => user.id)
  );

  const { recordAuditEvent } = await import('@/lib/audit/record-audit-event');
  const { AuditActorType } = await import('@prisma/client');
  await recordAuditEvent({
    organizationId,
    eventType: 'data.deletion_requested',
    actorType: AuditActorType.SYSTEM,
    actorId: 'system',
    resourceType: 'organization',
    resourceId: organizationId,
    captureIp: false
  });
  await recordAuditEvent({
    organizationId,
    eventType: 'org.deleted',
    actorType: AuditActorType.SYSTEM,
    actorId: 'system',
    resourceType: 'organization',
    resourceId: organizationId,
    before: { ownerId: organization.ownerId },
    captureIp: false
  });

  await prisma.organization.delete({
    where: { id: organizationId }
  });
}
