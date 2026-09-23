import 'server-only';

import { normalizeContactEmail } from '@/lib/contacts/contact-email';
import { prisma } from '@/lib/db/prisma';
import {
  mailThreadAccessWhere,
  resolveMailAliasScope
} from '@/lib/inbox/mail-alias-scope';

export type ContactHistoryThread = {
  id: string;
  subject: string;
  mailbox: string;
  direction: string;
  lastAt: string;
  snippet: string | null;
};

function snippet(value: string | null): string | null {
  if (!value) return null;
  const text = value.replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, 160) : null;
}

/**
 * Mail in the active business between this user and one contact.
 * Scoped to threads the user can already open.
 */
export async function loadContactMailHistory(input: {
  userId: string;
  organizationId: string;
  email: string;
  limit?: number;
}): Promise<ContactHistoryThread[]> {
  const email = normalizeContactEmail(input.email);
  if (!email) return [];

  const scope = await resolveMailAliasScope({
    userId: input.userId,
    organizationId: input.organizationId
  });
  const access = mailThreadAccessWhere({
    organizationId: input.organizationId,
    userId: input.userId,
    scope
  });

  const messages = await prisma.mailMessage.findMany({
    where: {
      thread: access,
      OR: [
        { fromAddress: { equals: email, mode: 'insensitive' } },
        { fromAddress: { contains: `<${email}>`, mode: 'insensitive' } },
        { toAddresses: { has: email } },
        { ccAddresses: { has: email } }
      ]
    },
    orderBy: { sentAt: 'desc' },
    take: 40,
    select: {
      direction: true,
      bodyText: true,
      sentAt: true,
      thread: {
        select: {
          id: true,
          subject: true,
          alias: { select: { address: true } }
        }
      }
    }
  });

  const limit = input.limit ?? 8;
  const seen = new Set<string>();
  const threads: ContactHistoryThread[] = [];

  for (const message of messages) {
    if (seen.has(message.thread.id)) continue;
    seen.add(message.thread.id);
    threads.push({
      id: message.thread.id,
      subject: message.thread.subject,
      mailbox: message.thread.alias.address,
      direction: message.direction,
      lastAt: message.sentAt.toISOString(),
      snippet: snippet(message.bodyText)
    });
    if (threads.length >= limit) break;
  }

  return threads;
}
