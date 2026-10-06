import 'server-only';

import { cache } from 'react';

import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

/**
 * Read/write the workspace toggle via SQL so inbox settings work even when
 * `prisma generate` cannot refresh the Windows query-engine lock.
 */
export async function readInboxAutoDetectMail(
  organizationId: string
): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ inboxAutoDetectMail: boolean }>>`
    SELECT "inboxAutoDetectMail"
    FROM "Organization"
    WHERE id = ${organizationId}::uuid
  `;
  return rows[0]?.inboxAutoDetectMail ?? true;
}

export async function writeInboxAutoDetectMail(
  organizationId: string,
  enabled: boolean
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "Organization"
    SET "inboxAutoDetectMail" = ${enabled}
    WHERE id = ${organizationId}::uuid
  `;
}

export const getInboxAutoDetectMail = cache(async (): Promise<boolean> => {
  const session = await dedupedAuth();
  if (!checkSession(session) || !session.user.organizationId) {
    return true;
  }
  return readInboxAutoDetectMail(session.user.organizationId);
});
