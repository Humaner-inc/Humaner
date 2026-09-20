import 'server-only';

import { cache } from 'react';
import { after } from 'next/server';
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
 * - Teammates with Inbox page access and every (or no) alias membership → all.
 * - Teammates restricted to a subset of channels → those aliases only.
 * - Everyone else → only aliases they were explicitly added to.
 */
const resolveMailAliasScopeCached = cache(
  async (userId: string, organizationId: string): Promise<MailAliasScope> => {
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId
        }
      },
      select: { workspaceRole: true, allowedPages: true }
    });

    const isOwner = membership?.workspaceRole === WorkspaceRole.OWNER;
    const hasInboxPage = Boolean(membership?.allowedPages.includes('inbox'));

    const [enabledAliases, memberAliases] = await Promise.all([
      prisma.mailAlias.findMany({
        where: { organizationId, enabled: true },
        select: { id: true }
      }),
      prisma.mailAlias.findMany({
        where: {
          organizationId,
          enabled: true,
          members: { some: { userId } }
        },
        select: { id: true }
      })
    ]);

    const memberAliasIds = memberAliases.map((alias) => alias.id);
    const hasFullChannelAccess =
      isOwner ||
      (hasInboxPage &&
        (memberAliasIds.length === 0 ||
          memberAliasIds.length === enabledAliases.length));

    if (hasFullChannelAccess) {
      try {
        after(() => {
          void ensureAllAliasMemberships(userId, organizationId);
        });
      } catch {
        void ensureAllAliasMemberships(userId, organizationId);
      }
      return { type: 'all' };
    }

    return { type: 'ids', aliasIds: memberAliasIds };
  }
);

export async function resolveMailAliasScope(input: {
  userId: string;
  organizationId: string;
}): Promise<MailAliasScope> {
  return resolveMailAliasScopeCached(input.userId, input.organizationId);
}

export function aliasIdFilter(
  scope: MailAliasScope
): { in: string[] } | undefined {
  if (scope.type === 'all') return undefined;
  return { in: scope.aliasIds };
}

/** Inbox aliases plus threads assigned to this user. */
export function mailThreadAccessWhere(input: {
  organizationId: string;
  userId: string;
  scope: MailAliasScope;
}): {
  organizationId: string;
  OR?: Array<{ aliasId: { in: string[] } } | { assigneeId: string }>;
} {
  if (input.scope.type === 'all') {
    return { organizationId: input.organizationId };
  }

  const clauses: Array<{ aliasId: { in: string[] } } | { assigneeId: string }> =
    [{ assigneeId: input.userId }];
  if (input.scope.aliasIds.length > 0) {
    clauses.push({ aliasId: { in: input.scope.aliasIds } });
  }

  return {
    organizationId: input.organizationId,
    OR: clauses
  };
}

/** Recipients who may see a thread — same rules as `mailThreadAccessWhere`. */
export async function filterUsersWithThreadAccess(input: {
  organizationId: string;
  threadId: string;
  userIds: string[];
}): Promise<string[]> {
  if (input.userIds.length === 0) return [];

  const thread = await prisma.mailThread.findFirst({
    where: {
      id: input.threadId,
      organizationId: input.organizationId
    },
    select: { aliasId: true, assigneeId: true }
  });
  if (!thread) return [];

  const [memberships, aliasMembers, userAliasMemberships] = await Promise.all([
    prisma.organizationMembership.findMany({
      where: {
        organizationId: input.organizationId,
        userId: { in: input.userIds }
      },
      select: { userId: true, workspaceRole: true, allowedPages: true }
    }),
    prisma.mailAliasMember.findMany({
      where: {
        aliasId: thread.aliasId,
        userId: { in: input.userIds }
      },
      select: { userId: true }
    }),
    prisma.mailAliasMember.findMany({
      where: {
        userId: { in: input.userIds },
        alias: { organizationId: input.organizationId, enabled: true }
      },
      select: { userId: true, aliasId: true }
    })
  ]);

  const membershipByUser = new Map(
    memberships.map((membership) => [membership.userId, membership])
  );
  const aliasMemberIds = new Set(aliasMembers.map((member) => member.userId));
  const aliasIdsByUser = new Map<string, string[]>();
  for (const row of userAliasMemberships) {
    const current = aliasIdsByUser.get(row.userId) ?? [];
    current.push(row.aliasId);
    aliasIdsByUser.set(row.userId, current);
  }

  return input.userIds.filter((userId) => {
    const membership = membershipByUser.get(userId);
    if (!membership) return false;
    if (membership.workspaceRole === WorkspaceRole.OWNER) return true;
    if (thread.assigneeId === userId) return true;
    if (aliasMemberIds.has(userId)) return true;
    if (!membership.allowedPages.includes('inbox')) return false;
    const userAliases = aliasIdsByUser.get(userId) ?? [];
    return userAliases.length === 0;
  });
}
