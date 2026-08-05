import 'server-only';

import { WorkspaceRole } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { PreConditionError } from '@/lib/validation/exceptions';

type DeleteUserAccountInput = {
  userId: string;
  organizationId: string | null | undefined;
  email: string;
};

/** Hard-delete a user row and personal auth/profile records. */
export async function deleteUserRecords(
  userId: string,
  email: string
): Promise<void> {
  await prisma.$transaction([
    prisma.userImage.deleteMany({ where: { userId } }),
    prisma.invitation.deleteMany({ where: { email } }),
    prisma.account.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.verificationToken.deleteMany({ where: { identifier: email } }),
    prisma.changeEmailRequest.deleteMany({ where: { userId } }),
    prisma.resetPasswordRequest.deleteMany({ where: { email } }),
    prisma.organizationMembership.deleteMany({ where: { userId } }),
    prisma.user.deleteMany({ where: { id: userId } })
  ]);
}

/**
 * Deletes only the user's account data. Workspaces are never deleted as a
 * side-effect: sole-member and owned workspaces must be deleted first.
 */
export async function deleteUserAccount(
  input: DeleteUserAccountInput
): Promise<void> {
  const [memberships, ownedOrganizations] = await Promise.all([
    prisma.organizationMembership.findMany({
      where: { userId: input.userId },
      select: {
        organizationId: true,
        workspaceRole: true,
        organization: { select: { name: true, ownerId: true } }
      }
    }),
    prisma.organization.findMany({
      where: { ownerId: input.userId },
      select: { id: true, name: true }
    })
  ]);

  if (memberships.length === 0 && ownedOrganizations.length === 0) {
    await deleteUserRecords(input.userId, input.email);
    return;
  }

  const blockingWorkspaceNames = new Set<string>();

  for (const owned of ownedOrganizations) {
    blockingWorkspaceNames.add(owned.name);
  }

  for (const membership of memberships) {
    const memberCount = await prisma.organizationMembership.count({
      where: { organizationId: membership.organizationId }
    });

    if (memberCount <= 1) {
      blockingWorkspaceNames.add(membership.organization.name);
      continue;
    }

    const isOwner =
      membership.organization.ownerId === input.userId ||
      membership.workspaceRole === WorkspaceRole.OWNER;

    if (isOwner) {
      blockingWorkspaceNames.add(membership.organization.name);
    }
  }

  if (blockingWorkspaceNames.size > 0) {
    const names = [...blockingWorkspaceNames].sort().join(', ');
    throw new PreConditionError(
      `Delete these workspaces first, then delete your account: ${names}.`
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: input.userId },
      data: { organizationId: null }
    });
    await tx.userImage.deleteMany({ where: { userId: input.userId } });
    await tx.invitation.deleteMany({ where: { email: input.email } });
    await tx.account.deleteMany({ where: { userId: input.userId } });
    await tx.session.deleteMany({ where: { userId: input.userId } });
    await tx.verificationToken.deleteMany({
      where: { identifier: input.email }
    });
    await tx.changeEmailRequest.deleteMany({ where: { userId: input.userId } });
    await tx.resetPasswordRequest.deleteMany({ where: { email: input.email } });
    await tx.organizationMembership.deleteMany({
      where: { userId: input.userId }
    });
    await tx.user.delete({ where: { id: input.userId } });
  });
}
