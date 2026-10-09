'use client';

import * as React from 'react';

import { InboxListChrome } from '@/components/dashboard/inbox/inbox-list-chrome';
import {
  InboxListHeader,
  type InboxListFilter
} from '@/components/dashboard/inbox/inbox-list-header';
import { MailThreadList } from '@/components/dashboard/inbox/mail-thread-list';
import type { AssigneePerson } from '@/components/ui/assignees';
import type {
  MailInboxOption,
  MailTagItem,
  MailThreadListItem
} from '@/data/inbox/get-mail-threads';

export function InboxAllMailList({
  threads,
  tags,
  members,
  inboxes,
  activeMailboxId,
  activeFilter,
  activeTagId,
  autoCompose = false,
  emptyLabel
}: {
  threads: MailThreadListItem[];
  tags: MailTagItem[];
  members: AssigneePerson[];
  inboxes: MailInboxOption[];
  activeMailboxId: string | null;
  activeFilter: InboxListFilter;
  activeTagId: string | null;
  autoCompose?: boolean;
  emptyLabel?: string;
}): React.JSX.Element {
  return (
    <MailThreadList
      variant="desk"
      threads={threads}
      tags={tags}
      members={members}
      emptyLabel={emptyLabel}
      listChrome={
        <InboxListChrome
          inboxes={inboxes}
          activeMailboxId={activeMailboxId}
          autoCompose={autoCompose}
        />
      }
      selectionHeader={(selection) => (
        <InboxListHeader
          activeFilter={activeFilter}
          activeTagId={activeTagId}
          activeMailboxId={activeMailboxId}
          tags={tags}
          selection={selection}
        />
      )}
    />
  );
}
