import 'server-only';

import { InvitationStatus, Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function deleteChangeEmailRequestsByEmail(
  db: DbClient,
  email: string
): Promise<void> {
  const rows = await db.changeEmailRequest.findMany({
    where: { email },
    select: { id: true }
  });
  for (const row of rows) {
    await db.changeEmailRequest.delete({ where: { id: row.id } });
  }
}

export async function deleteResetPasswordRequestsByEmail(
  db: DbClient,
  email: string
): Promise<void> {
  const rows = await db.resetPasswordRequest.findMany({
    where: { email },
    select: { id: true }
  });
  for (const row of rows) {
    await db.resetPasswordRequest.delete({ where: { id: row.id } });
  }
}

export async function expireVerificationTokensForEmail(
  db: DbClient,
  email: string
): Promise<void> {
  const rows = await db.verificationToken.findMany({
    where: { identifier: email },
    select: { token: true }
  });
  const expired = new Date(+0);
  for (const row of rows) {
    await db.verificationToken.update({
      where: { token: row.token },
      data: { expires: expired }
    });
  }
}

export async function deleteVerificationTokensForEmail(
  db: DbClient,
  email: string
): Promise<void> {
  const rows = await db.verificationToken.findMany({
    where: { identifier: email },
    select: { token: true }
  });
  for (const row of rows) {
    await db.verificationToken.delete({ where: { token: row.token } });
  }
}

export async function updateOrganizationsForOwner(
  db: DbClient,
  ownerId: string,
  data: Prisma.OrganizationUncheckedUpdateInput
): Promise<void> {
  const [orgs, owner] = await Promise.all([
    db.organization.findMany({
      where: { ownerId },
      select: { id: true, ownerId: true }
    }),
    db.user.findUnique({
      where: { id: ownerId },
      select: { organizationId: true }
    })
  ]);
  const byId = new Map(orgs.map((org) => [org.id, org.ownerId]));
  if (owner?.organizationId && !byId.has(owner.organizationId)) {
    const active = await db.organization.findUnique({
      where: { id: owner.organizationId },
      select: { id: true, ownerId: true }
    });
    if (active) {
      byId.set(active.id, active.ownerId);
    }
  }
  for (const [id, existingOwnerId] of byId) {
    await db.organization.update({
      where: { id },
      data: {
        ...data,
        ...(existingOwnerId ? {} : { ownerId })
      }
    });
  }
}

export async function deleteSessionsForUser(
  db: DbClient,
  userId: string
): Promise<void> {
  const rows = await db.session.findMany({
    where: { userId },
    select: { id: true }
  });
  for (const row of rows) {
    await db.session.delete({ where: { id: row.id } });
  }
}

export async function deleteChangeEmailRequestsByUserId(
  db: DbClient,
  userId: string
): Promise<void> {
  const rows = await db.changeEmailRequest.findMany({
    where: { userId },
    select: { id: true }
  });
  for (const row of rows) {
    await db.changeEmailRequest.delete({ where: { id: row.id } });
  }
}

export async function invalidateChangeEmailRequestsForUser(
  db: DbClient,
  userId: string
): Promise<void> {
  const rows = await db.changeEmailRequest.findMany({
    where: { userId },
    select: { id: true }
  });
  for (const row of rows) {
    await db.changeEmailRequest.update({
      where: { id: row.id },
      data: { valid: false }
    });
  }
}

export async function deleteUserImagesForUser(
  db: DbClient,
  userId: string
): Promise<void> {
  const rows = await db.userImage.findMany({
    where: { userId },
    select: { id: true }
  });
  for (const row of rows) {
    await db.userImage.delete({ where: { id: row.id } });
  }
}

export async function deleteAccountsForUser(
  db: DbClient,
  userId: string
): Promise<void> {
  const rows = await db.account.findMany({
    where: { userId },
    select: { id: true }
  });
  for (const row of rows) {
    await db.account.delete({ where: { id: row.id } });
  }
}

export async function revokeOpenInvitationsForEmail(
  db: DbClient,
  organizationId: string,
  email: string
): Promise<void> {
  const rows = await db.invitation.findMany({
    where: {
      organizationId,
      email,
      AND: [
        { NOT: { status: { equals: InvitationStatus.ACCEPTED } } },
        { NOT: { status: { equals: InvitationStatus.REVOKED } } }
      ]
    },
    select: { id: true }
  });
  for (const row of rows) {
    await db.invitation.update({
      where: { id: row.id },
      data: { status: InvitationStatus.REVOKED }
    });
  }
}

export async function deleteInvitationsByEmail(
  db: DbClient,
  email: string
): Promise<void> {
  const rows = await db.invitation.findMany({
    where: { email },
    select: { id: true }
  });
  for (const row of rows) {
    await db.invitation.delete({ where: { id: row.id } });
  }
}

export async function deleteMembershipsForUser(
  db: DbClient,
  userId: string
): Promise<void> {
  const rows = await db.organizationMembership.findMany({
    where: { userId },
    select: { id: true }
  });
  for (const row of rows) {
    await db.organizationMembership.delete({ where: { id: row.id } });
  }
}

export async function deleteMailAliasMembersForUserInOrganization(
  db: DbClient,
  userId: string,
  organizationId: string,
  exceptAliasIds: string[] = []
): Promise<void> {
  const rows = await db.mailAliasMember.findMany({
    where: {
      userId,
      alias: { organizationId },
      ...(exceptAliasIds.length > 0
        ? { aliasId: { notIn: exceptAliasIds } }
        : {})
    },
    select: { id: true }
  });
  for (const row of rows) {
    await db.mailAliasMember.delete({ where: { id: row.id } });
  }
}

export function isPrismaSerializationFailure(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2034'
  );
}

export function isPrismaRecordNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2025'
  );
}

export async function decrementUserCreditsIfSufficient(
  ownerId: string,
  cents: number
): Promise<{ claimed: boolean; remainingCents: number }> {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const owner = await tx.user.findUnique({
          where: { id: ownerId },
          select: { creditBalanceCents: true }
        });
        if (!owner || owner.creditBalanceCents < cents) {
          return {
            claimed: false,
            remainingCents: owner?.creditBalanceCents ?? 0
          };
        }
        const updated = await tx.user.update({
          where: { id: ownerId },
          data: { creditBalanceCents: { decrement: cents } },
          select: { creditBalanceCents: true }
        });
        await updateOrganizationsForOwner(tx, ownerId, {
          creditBalanceCents: updated.creditBalanceCents
        });
        return { claimed: true, remainingCents: updated.creditBalanceCents };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    if (isPrismaSerializationFailure(error)) {
      const owner = await prisma.user.findUnique({
        where: { id: ownerId },
        select: { creditBalanceCents: true }
      });
      return { claimed: false, remainingCents: owner?.creditBalanceCents ?? 0 };
    }
    throw error;
  }
}

export async function updateAgentsForOrganization(
  db: DbClient,
  organizationId: string,
  data: Prisma.AgentUncheckedUpdateInput
): Promise<void> {
  const agents = await db.agent.findMany({
    where: { organizationId },
    select: { id: true }
  });
  for (const agent of agents) {
    await db.agent.update({ where: { id: agent.id }, data });
  }
}

export async function updateMailThreadsByIds(
  db: DbClient,
  ids: string[],
  data: Prisma.MailThreadUncheckedUpdateInput
): Promise<void> {
  for (const id of ids) {
    try {
      await db.mailThread.update({ where: { id }, data });
    } catch (error) {
      if (!isPrismaRecordNotFound(error)) {
        throw error;
      }
    }
  }
}

export async function deleteMailThreadTagsForThreads(
  db: DbClient,
  threadIds: string[]
): Promise<void> {
  if (threadIds.length === 0) {
    return;
  }
  const rows = await db.mailThreadTag.findMany({
    where: { threadId: { in: threadIds } },
    select: { id: true }
  });
  for (const row of rows) {
    await db.mailThreadTag.delete({ where: { id: row.id } });
  }
}

export async function deleteUserRelatedRecords(
  db: DbClient,
  userId: string,
  email: string
): Promise<void> {
  await deleteUserImagesForUser(db, userId);
  await deleteInvitationsByEmail(db, email);
  await deleteAccountsForUser(db, userId);
  await deleteSessionsForUser(db, userId);
  await deleteVerificationTokensForEmail(db, email);
  await deleteChangeEmailRequestsByUserId(db, userId);
  await deleteResetPasswordRequestsByEmail(db, email);
  await deleteMembershipsForUser(db, userId);
}
