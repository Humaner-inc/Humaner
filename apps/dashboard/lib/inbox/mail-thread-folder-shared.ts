export type MailListFolder =
  | 'inbox'
  | 'drafts'
  | 'sent'
  | 'archive'
  | 'spam'
  | 'trash';

export type MailFolderState = {
  folder: 'INBOX' | 'DRAFT' | 'SENT' | 'SPAM' | 'TRASH';
  archivedAt: Date | null;
  trashedAt: Date | null;
};

/**
 * Shared folder presence rank for Gmail + IMAP.
 * Matches provider list UIs: active Inbox beats Trash/Spam when both appear
 * (mixed labels / Gmail-IMAP label-as-folder duplicates).
 *
 * Higher = more authoritative for where the thread should show.
 */
export function mailFolderPresenceRank(state: {
  folder: MailFolderState['folder'];
  archivedAt: Date | null;
}): number {
  if (state.folder === 'INBOX' && !state.archivedAt) return 50;
  if (state.folder === 'SPAM') return 40;
  if (state.folder === 'DRAFT') return 30;
  if (state.folder === 'SENT') return 20;
  if (state.folder === 'TRASH') return 10;
  // Archived (INBOX/SENT + archivedAt) or unknown
  return 1;
}

/** Pick the folder state that should win when the same thread is seen twice. */
export function preferMailFolderState(
  current: MailFolderState,
  incoming: MailFolderState
): MailFolderState {
  return mailFolderPresenceRank(incoming) >= mailFolderPresenceRank(current)
    ? incoming
    : current;
}

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
