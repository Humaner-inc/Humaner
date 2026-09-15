import 'server-only';

import { prisma } from '@/lib/db/prisma';
import {
  parseMailTrashRetention,
  type MailTrashRetentionValue
} from '@/lib/inbox/mail-trash-retention';

export async function readTrashRetention(
  organizationId: string
): Promise<MailTrashRetentionValue> {
  const rows = await prisma.$queryRaw<Array<{ trashRetention: string }>>`
    SELECT "trashRetention"::text AS "trashRetention"
    FROM "Organization"
    WHERE id = ${organizationId}::uuid
  `;
  return parseMailTrashRetention(rows[0]?.trashRetention);
}

export async function writeTrashRetention(
  organizationId: string,
  retention: MailTrashRetentionValue
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "Organization"
    SET "trashRetention" = ${retention.toLowerCase()}::"MailTrashRetention"
    WHERE id = ${organizationId}::uuid
  `;
}
