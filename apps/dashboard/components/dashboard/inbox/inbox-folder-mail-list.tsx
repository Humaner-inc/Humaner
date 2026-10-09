'use client';

import * as React from 'react';

import { InboxListChrome } from '@/components/dashboard/inbox/inbox-list-chrome';
import { InboxListHeader } from '@/components/dashboard/inbox/inbox-list-header';
import { MailThreadList } from '@/components/dashboard/inbox/mail-thread-list';
import type { AssigneePerson } from '@/components/ui/assignees';
import type {
  MailInboxOption,
  MailTagItem,
  MailThreadListItem
} from '@/data/inbox/get-mail-threads';
import type { MailListFolder } from '@/lib/inbox/mail-thread-folder-shared';

/**
 * Drafts, Sent and Archive: the All inbox chrome without the status filters.
 * A client component so the `selectionHeader` render prop never crosses the
 * server boundary.
 */
export function InboxFolderMailList({
  folder,
  threads,
  tags,
  members,
  inboxes,
  activeMailboxId,
  emptyLabel
}: {
  folder: MailListFolder;
  threads: MailThreadListItem[];
  tags: MailTagItem[];
  members: AssigneePerson[];
  inboxes: MailInboxOption[];
  activeMailboxId: string | null;
  emptyLabel?: string;
}): React.JSX.Element {
  return (
    <MailThreadList
      variant="desk"
      threads={threads}
      tags={tags}
      members={members}
      folderView={folder}
      emptyLabel={emptyLabel}
      listChrome={
        <InboxListChrome
          inboxes={inboxes}
          activeMailboxId={activeMailboxId}
        />
      }
      selectionHeader={(selection) => (
        <InboxListHeader
          showFilters={false}
          activeMailboxId={activeMailboxId}
          selection={selection}
        />
      )}
    />
  );
}
