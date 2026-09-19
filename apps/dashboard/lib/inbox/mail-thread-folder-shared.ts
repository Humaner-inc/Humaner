export type MailListFolder =
  | 'inbox'
  | 'drafts'
  | 'sent'
  | 'archive'
  | 'spam'
  | 'trash';

export function mailThreadListWhere(folder: MailListFolder): {
  folder:
    | 'INBOX'
    | 'DRAFT'
    | 'SENT'
    | 'SPAM'
    | 'TRASH'
    | { in: Array<'INBOX' | 'SENT'> };
  archivedAt?: null | { not: null };
} {
  switch (folder) {
    case 'drafts':
      return { folder: 'DRAFT', archivedAt: null };
    case 'sent':
      return { folder: 'SENT', archivedAt: null };
    case 'spam':
      return { folder: 'SPAM' };
    case 'trash':
      return { folder: 'TRASH' };
    case 'archive':
      return {
        archivedAt: { not: null },
        folder: { in: ['INBOX', 'SENT'] }
      };
    default:
      return { folder: 'INBOX', archivedAt: null };
  }
}
