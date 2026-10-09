'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';

import { ComposeMailButton } from '@/components/dashboard/inbox/compose-mail-button';
import { InboxDomainSwitcher } from '@/components/dashboard/inbox/inbox-domain-switcher';
import { InboxSearchBar } from '@/components/dashboard/inbox/inbox-search-bar';
import type { MailInboxOption } from '@/data/inbox/get-mail-threads';
import { primaryAliasForMailbox } from '@/lib/inbox/mail-inbox-groups';
import { cn } from '@/lib/utils';

/** Mailbox switcher, search and compose — the header shared by All, Drafts, Sent and Archive. */
export function InboxListChrome({
  inboxes,
  activeMailboxId,
  autoCompose = false
}: {
  inboxes: MailInboxOption[];
  activeMailboxId: string | null;
  autoCompose?: boolean;
}): React.JSX.Element {
  const searchParams = useSearchParams();
  const [searchOpen, setSearchOpen] = React.useState(
    Boolean(searchParams.get('q'))
  );

  return (
    <div className="flex items-center gap-2 px-3 py-3">
      <div
        className={cn(
          'min-w-0 transition-[max-width,opacity] duration-200',
          searchOpen
            ? 'pointer-events-none max-w-0 flex-none overflow-hidden opacity-0'
            : 'max-w-72 flex-1 opacity-100'
        )}
      >
        <InboxDomainSwitcher
          inboxes={inboxes}
          activeMailboxId={activeMailboxId}
        />
      </div>
      <InboxSearchBar
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
      <ComposeMailButton
        inboxes={inboxes}
        defaultAliasId={primaryAliasForMailbox(inboxes, activeMailboxId)}
        autoOpen={autoCompose}
      />
    </div>
  );
}
