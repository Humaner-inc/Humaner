import 'server-only';

import { MailThreadFolder } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { mailThreadListWhere } from '@/lib/inbox/mail-thread-folder-shared';

export type { MailListFolder } from '@/lib/inbox/mail-thread-folder-shared';
export { mailThreadListWhere } from '@/lib/inbox/mail-thread-folder-shared';

export function extractMailAddress(value: string): string {
  const trimmed = value.trim();
  const bracketed = trimmed.match(/<([^<>]+)>/);
  return (bracketed?.[1] ?? trimmed).trim().toLowerCase();
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

export function mailFolderWriteData(
  folder: MailThreadFolder,
  now = new Date()
): {
  folder: MailThreadFolder;
  archivedAt: null;
  trashedAt: Date | null;
} {
  return {
    folder,
    archivedAt: null,
    trashedAt: folder === MailThreadFolder.TRASH ? now : null
  };
}

export function inboundThreadPatch(input: {
  currentFolder: MailThreadFolder;
  fromAddress: string;
  blocked: Set<string>;
}): {
  folder?: MailThreadFolder;
  archivedAt?: Date | null;
  trashedAt?: Date | null;
  isUnread: true;
} {
  const email = extractMailAddress(input.fromAddress);
  if (blockedHas(input.blocked, email)) {
    return {
      folder: MailThreadFolder.SPAM,
      archivedAt: null,
      trashedAt: null,
      isUnread: true
    };
  }
  if (
    input.currentFolder === MailThreadFolder.SPAM ||
    input.currentFolder === MailThreadFolder.TRASH ||
    input.currentFolder === MailThreadFolder.DRAFT
  ) {
    return { isUnread: true };
  }
  return {
    folder: MailThreadFolder.INBOX,
    archivedAt: null,
    trashedAt: null,
    isUnread: true
  };
}
