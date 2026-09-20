import { prisma } from '@/lib/db/prisma';
import { ensureAllAliasMemberships } from '@/lib/inbox/mail-alias-scope';

export async function applyInvitationTimeZone(input: {
  userId: string;
  timeZone?: string | null;
}): Promise<void> {
  const timeZone = input.timeZone?.trim();
  if (!timeZone) return;

  await prisma.user.updateMany({
    where: { id: input.userId, timeZone: null },
    data: { timeZone }
  });
}

/** Empty `allowedAliasIds` grants every enabled inbox channel. */
export async function syncUserAliasMemberships(input: {
  userId: string;
  organizationId: string;
  allowedPages: string[];
  allowedAliasIds?: string[];
}): Promise<void> {
  if (!input.allowedPages.includes('inbox')) {
    return;
  }

  const requested = (input.allowedAliasIds ?? []).filter(Boolean);
  if (requested.length === 0) {
    await ensureAllAliasMemberships(input.userId, input.organizationId);
    return;
  }

  const aliases = await prisma.mailAlias.findMany({
    where: {
      organizationId: input.organizationId,
      enabled: true,
      id: { in: requested }
    },
    select: { id: true }
  });
  const keepIds = aliases.map((alias) => alias.id);

  await prisma.mailAliasMember.deleteMany({
    where: {
      userId: input.userId,
      alias: { organizationId: input.organizationId },
      ...(keepIds.length > 0 ? { aliasId: { notIn: keepIds } } : {})
    }
  });

  if (keepIds.length === 0) {
    return;
  }

  await prisma.mailAliasMember.createMany({
    data: keepIds.map((aliasId) => ({
      aliasId,
      userId: input.userId
    })),
    skipDuplicates: true
  });
}

export async function applyInvitationGrants(input: {
  userId: string;
  organizationId: string;
  allowedPages: string[];
  timeZone?: string | null;
  allowedAliasIds?: string[];
}): Promise<void> {
  await Promise.all([
    applyInvitationTimeZone({
      userId: input.userId,
      timeZone: input.timeZone
    }),
    syncUserAliasMemberships({
      userId: input.userId,
      organizationId: input.organizationId,
      allowedPages: input.allowedPages,
      allowedAliasIds: input.allowedAliasIds
    })
  ]);
}
