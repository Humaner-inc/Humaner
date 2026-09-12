import 'server-only';

import type { ChatAttachmentPayload } from '@humaner/shared/chat-attachments';

import { parseChatAttachments } from '@/lib/chat/chat-attachments';
import { prisma } from '@/lib/db/prisma';

export async function setTeamMessageAttachments(
  messageId: string,
  attachments: ChatAttachmentPayload[]
): Promise<void> {
  if (attachments.length === 0) return;
  await prisma.$executeRawUnsafe(
    `UPDATE "TeamMessage" SET attachments = $1::jsonb WHERE id = $2::uuid`,
    JSON.stringify(attachments),
    messageId
  );
}

export async function getTeamMessageAttachmentsByIds(
  ids: string[]
): Promise<Map<string, ChatAttachmentPayload[]>> {
  const map = new Map<string, ChatAttachmentPayload[]>();
  if (ids.length === 0) return map;
  const rows = await prisma.$queryRawUnsafe<
    Array<{ id: string; attachments: unknown }>
  >(
    `SELECT id::text AS id, attachments FROM "TeamMessage" WHERE id = ANY($1::uuid[])`,
    ids
  );
  for (const row of rows) {
    map.set(row.id, parseChatAttachments(row.attachments));
  }
  return map;
}
