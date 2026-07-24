'use client';

import * as React from 'react';

import {
  InboxListHeader,
  type InboxListFilter
} from '@/components/dashboard/inbox/inbox-list-header';
import { MailThreadList } from '@/components/dashboard/inbox/mail-thread-list';
import type {
  MailTagItem,
  MailThreadListItem
} from '@/data/inbox/get-mail-threads';

export function InboxAllMailList({
  threads,
  tags,
  members,
  activeFilter,
  activeTagId
}: {
  threads: MailThreadListItem[];
  tags: MailTagItem[];
  members: Array<{ id: string; name: string }>;
  activeFilter: InboxListFilter;
  activeTagId: string | null;
}): React.JSX.Element {
  return (
    <MailThreadList
      threads={threads}
      tags={tags}
      members={members}
      selectionHeader={(selection) => (
        <InboxListHeader
          activeFilter={activeFilter}
          activeTagId={activeTagId}
          tags={tags}
          selection={selection}
        />
      )}
    />
  );
}
