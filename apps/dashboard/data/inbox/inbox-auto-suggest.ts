import 'server-only';

import { cache } from 'react';

import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

/**
 * Read/write the workspace toggle via SQL so inbox settings work even when
 * `prisma generate` cannot refresh the Windows query-engine lock.
 */
export async function readInboxAutoSuggestReplies(
  organizationId: string
): Promise<boolean> {
  const rows = await prisma.$queryRaw<
    Array<{ inboxAutoSuggestReplies: boolean }>
  >`
    SELECT "inboxAutoSuggestReplies"
    FROM "Organization"
    WHERE id = ${organizationId}::uuid
  `;
  return rows[0]?.inboxAutoSuggestReplies ?? true;
}

export async function writeInboxAutoSuggestReplies(
  organizationId: string,
  enabled: boolean
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "Organization"
    SET "inboxAutoSuggestReplies" = ${enabled}
    WHERE id = ${organizationId}::uuid
  `;
}

export const getInboxAutoSuggestReplies = cache(async (): Promise<boolean> => {
  const session = await dedupedAuth();
  if (!checkSession(session) || !session.user.organizationId) {
    return true;
  }
  return readInboxAutoSuggestReplies(session.user.organizationId);
});
