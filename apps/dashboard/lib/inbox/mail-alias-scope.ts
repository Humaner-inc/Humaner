import 'server-only';

import { WorkspaceRole } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

export type MailAliasScope =
  | { type: 'all' }
  | { type: 'ids'; aliasIds: string[] };

/** Ensure the user is a member of every enabled alias in the workspace. */
export async function ensureAllAliasMemberships(
  userId: string,
  organizationId: string
): Promise<void> {
  const aliases = await prisma.mailAlias.findMany({
    where: { organizationId, enabled: true },
    select: { id: true }
  });
  if (aliases.length === 0) return;

  await prisma.mailAliasMember.createMany({
    data: aliases.map((alias) => ({
      aliasId: alias.id,
      userId
    })),
    skipDuplicates: true
  });
}

/**
 * Collaborative inbox scope.
 * - Workspace owners → every alias (and memberships are healed).
 * - Teammates with Inbox page access → every alias (memberships healed).
 * - Everyone else → only aliases they were explicitly added to.
 */
export async function resolveMailAliasScope(input: {
  userId: string;
  organizationId: string;
}): Promise<MailAliasScope> {
  const membership = await prisma.organizationMembership.findUnique({
    where: {
      userId_organizationId: {
        userId: input.userId,
        organizationId: input.organizationId
      }
    },
    select: { workspaceRole: true, allowedPages: true }
  });

  const hasFullInbox =
    membership?.workspaceRole === WorkspaceRole.OWNER ||
    Boolean(membership?.allowedPages.includes('inbox'));

  if (hasFullInbox) {
    await ensureAllAliasMemberships(input.userId, input.organizationId);
    return { type: 'all' };
  }

  const aliases = await prisma.mailAlias.findMany({
    where: {
      organizationId: input.organizationId,
      enabled: true,
      members: { some: { userId: input.userId } }
    },
    select: { id: true }
  });

  return { type: 'ids', aliasIds: aliases.map((alias) => alias.id) };
}

export function aliasIdFilter(
  scope: MailAliasScope
): { in: string[] } | undefined {
  if (scope.type === 'all') return undefined;
  return { in: scope.aliasIds };
}
