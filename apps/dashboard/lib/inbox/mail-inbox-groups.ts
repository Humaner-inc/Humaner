import type { MailInboxOption } from '@/data/inbox/get-mail-threads';

export type MailMailboxGroup = {
  connectionId: string;
  email: string;
  providerName: string;
  unreadCount: number;
  aliases: MailInboxOption[];
};

export function groupMailInboxes(
  inboxes: MailInboxOption[]
): MailMailboxGroup[] {
  const groups: MailMailboxGroup[] = [];
  const indexByConnection = new Map<string, number>();

  for (const inbox of inboxes) {
    const existing = indexByConnection.get(inbox.connectionId);
    if (existing !== undefined) {
      groups[existing].unreadCount += inbox.unreadCount;
      groups[existing].aliases.push(inbox);
      continue;
    }
    indexByConnection.set(inbox.connectionId, groups.length);
    groups.push({
      connectionId: inbox.connectionId,
      email: inbox.connectionEmail,
      providerName: inbox.providerName,
      unreadCount: inbox.unreadCount,
      aliases: [inbox]
    });
  }

  return groups;
}

export function primaryAliasForMailbox(
  inboxes: MailInboxOption[],
  connectionId: string | null
): string | null {
  const aliases = connectionId
    ? inboxes.filter((inbox) => inbox.connectionId === connectionId)
    : inboxes;
  const login = aliases.find(
    (inbox) =>
      inbox.address.toLowerCase() === inbox.connectionEmail.toLowerCase()
  );
  return login?.id ?? aliases[0]?.id ?? null;
}
