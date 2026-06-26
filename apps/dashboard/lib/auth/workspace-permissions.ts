import 'server-only';

import { InvitationStatus, WorkspaceRole } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { ForbiddenError } from '@/lib/validation/exceptions';

export async function requireWorkspaceOwner(userId: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: { workspaceRole: true }
  });

  if (!user || user.workspaceRole !== WorkspaceRole.OWNER) {
    throw new ForbiddenError('Workspace owner access required');
  }
}

export async function isWorkspaceOwner(userId: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: { workspaceRole: true }
  });

  return user?.workspaceRole === WorkspaceRole.OWNER;
}

export async function countOrganizationSeats(
  organizationId: string
): Promise<number> {
  const [memberCount, pendingInviteCount] = await prisma.$transaction([
    prisma.organizationMembership.count({ where: { organizationId } }),
    prisma.invitation.count({
      where: {
        organizationId,
        status: InvitationStatus.PENDING
      }
    })
  ]);

  return memberCount + pendingInviteCount;
}
