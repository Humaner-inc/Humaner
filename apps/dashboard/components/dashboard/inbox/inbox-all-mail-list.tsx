'use client';

import * as React from 'react';

import { ComposeMailButton } from '@/components/dashboard/inbox/compose-mail-button';
import { InboxDomainSwitcher } from '@/components/dashboard/inbox/inbox-domain-switcher';
import {
  InboxListHeader,
  type InboxListFilter
} from '@/components/dashboard/inbox/inbox-list-header';
import { MailThreadList } from '@/components/dashboard/inbox/mail-thread-list';
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
  activeAliasId,
  activeFilter,
  activeTagId,
  autoCompose = false
}: {
  threads: MailThreadListItem[];
  tags: MailTagItem[];
  members: Array<{ id: string; name: string }>;
  inboxes: MailInboxOption[];
  activeAliasId: string | null;
  activeFilter: InboxListFilter;
  activeTagId: string | null;
  autoCompose?: boolean;
}): React.JSX.Element {
  return (
    <MailThreadList
      variant="desk"
      threads={threads}
      tags={tags}
      members={members}
      listChrome={
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <InboxDomainSwitcher
            inboxes={inboxes}
            activeAliasId={activeAliasId}
          />
          <ComposeMailButton
            inboxes={inboxes}
            defaultAliasId={activeAliasId}
            autoOpen={autoCompose}
          />
        </div>
      }
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
