'use client';

import * as React from 'react';

import { ComposeMailButton } from '@/components/dashboard/inbox/compose-mail-button';
import { InboxDomainSwitcher } from '@/components/dashboard/inbox/inbox-domain-switcher';
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
import { primaryAliasForMailbox } from '@/lib/inbox/mail-inbox-groups';

export function InboxAllMailList({
  threads,
  tags,
  members,
  inboxes,
  activeMailboxId,
  activeFilter,
  activeTagId,
  autoCompose = false
}: {
  threads: MailThreadListItem[];
  tags: MailTagItem[];
  members: AssigneePerson[];
  inboxes: MailInboxOption[];
  activeMailboxId: string | null;
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
        <div className="flex items-center justify-between gap-2 px-3 py-3">
          <InboxDomainSwitcher
            inboxes={inboxes}
            activeMailboxId={activeMailboxId}
          />
          <ComposeMailButton
            inboxes={inboxes}
            defaultAliasId={primaryAliasForMailbox(inboxes, activeMailboxId)}
            autoOpen={autoCompose}
          />
        </div>
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
