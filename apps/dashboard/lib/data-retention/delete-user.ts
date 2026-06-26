import 'server-only';

import { Role } from '@prisma/client';

import { deleteOrganizationData } from '@/lib/data-retention/delete-organization';
import { prisma } from '@/lib/db/prisma';
import { PreConditionError } from '@/lib/validation/exceptions';

type DeleteUserAccountInput = {
  userId: string;
  organizationId: string | null | undefined;
  email: string;
};

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
    prisma.user.deleteMany({ where: { id: userId } })
  ]);
}

export async function deleteUserAccount(
  input: DeleteUserAccountInput
): Promise<void> {
  const memberships = await prisma.organizationMembership.findMany({
    where: { userId: input.userId },
    select: { organizationId: true }
  });

  if (memberships.length === 0) {
    await deleteUserRecords(input.userId, input.email);
    return;
  }

  for (const { organizationId } of memberships) {
    const memberCount = await prisma.organizationMembership.count({
      where: { organizationId }
    });
    if (memberCount <= 1) {
      await deleteOrganizationData(organizationId);
    }
  }

  if (input.organizationId) {
    const memberCount = await prisma.organizationMembership.count({
      where: { organizationId: input.organizationId }
    });

    if (memberCount > 1) {
      const user = await prisma.user.findFirst({
        where: { id: input.userId, organizationId: input.organizationId },
        select: { role: true }
      });

      if (!user) {
        await deleteUserRecords(input.userId, input.email);
        return;
      }

      if (user.role === Role.ADMIN) {
        const adminCount = await prisma.user.count({
          where: { organizationId: input.organizationId, role: Role.ADMIN }
        });
        if (adminCount <= 1) {
          throw new PreConditionError(
            'Assign another admin before deleting your account.'
          );
        }
      }
    }
  }

  await deleteUserRecords(input.userId, input.email);
}
