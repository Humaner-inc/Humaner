import 'server-only';

import { MailThreadFolder, type Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import type { MailListFolder } from '@/lib/inbox/mail-thread-folder-shared';

export type { MailListFolder } from '@/lib/inbox/mail-thread-folder-shared';

export function extractMailAddress(value: string): string {
  const trimmed = value.trim();
  const bracketed = trimmed.match(/<([^<>]+)>/);
  return (bracketed?.[1] ?? trimmed).trim().toLowerCase();
}

export function mailThreadListWhere(
  folder: MailListFolder
): Prisma.MailThreadWhereInput {
  switch (folder) {
    case 'sent':
      return { folder: MailThreadFolder.SENT, archivedAt: null };
    case 'spam':
      return { folder: MailThreadFolder.SPAM };
    case 'trash':
      return { folder: MailThreadFolder.TRASH };
    case 'archive':
      return {
        archivedAt: { not: null },
        folder: { in: [MailThreadFolder.INBOX, MailThreadFolder.SENT] }
      };
    default:
      return { folder: MailThreadFolder.INBOX, archivedAt: null };
  }
}

export const INBOX_ACTIVE_WHERE = mailThreadListWhere('inbox');

export async function loadBlockedSenderSet(
  organizationId: string
): Promise<Set<string>> {
  const rows = await prisma.mailBlockedSender.findMany({
    where: { organizationId },
    select: { email: true }
  });
  return new Set(rows.map((row) => row.email));
}

export function folderForNewThread(input: {
  direction: 'INBOUND' | 'OUTBOUND';
  fromAddress: string;
  blocked: Set<string>;
}): MailThreadFolder {
  if (input.direction === 'OUTBOUND') return MailThreadFolder.SENT;
  const email = extractMailAddress(input.fromAddress);
  return blockedHas(input.blocked, email)
    ? MailThreadFolder.SPAM
    : MailThreadFolder.INBOX;
}

function blockedHas(blocked: Set<string>, email: string): boolean {
  return email.length > 0 && blocked.has(email);
}

export function inboundThreadPatch(input: {
  currentFolder: MailThreadFolder;
  fromAddress: string;
  blocked: Set<string>;
}): {
  folder?: MailThreadFolder;
  archivedAt?: Date | null;
  isUnread: true;
} {
  const email = extractMailAddress(input.fromAddress);
  if (blockedHas(input.blocked, email)) {
    return { folder: MailThreadFolder.SPAM, isUnread: true };
  }
  if (
    input.currentFolder === MailThreadFolder.SPAM ||
    input.currentFolder === MailThreadFolder.TRASH
  ) {
    return { isUnread: true };
  }
  return {
    folder: MailThreadFolder.INBOX,
    archivedAt: null,
    isUnread: true
  };
}
