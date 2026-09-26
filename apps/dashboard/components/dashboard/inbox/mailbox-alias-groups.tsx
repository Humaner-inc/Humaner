'use client';

import * as React from 'react';
import { CheckIcon } from '@humaner/shared/icons';

import {
  InboxSettingsGroupCard,
  InboxSettingsGroupRow,
  InboxSettingsTrailingSlot
} from '@/components/dashboard/inbox/inbox-settings-group-card';
import type { MailAliasListItem } from '@/data/inbox/get-mail-aliases';

export type MailboxAliasGroup = {
  email: string;
  providerName: string;
  logoDomain: string;
  aliases: MailAliasListItem[];
};

export function MailboxAliasGroups({
  mailboxes
}: {
  mailboxes: MailboxAliasGroup[];
}): React.JSX.Element {
  return (
    <div className="space-y-4">
      {mailboxes.map((mailbox) => (
        <InboxSettingsGroupCard
          key={`${mailbox.providerName}-${mailbox.email}`}
          title={mailbox.email}
          subtitle={mailbox.providerName}
          logoDomain={mailbox.logoDomain}
        >
          {mailbox.aliases.map((alias) => {
            const isLogin =
              alias.address.toLowerCase() === mailbox.email.toLowerCase();
            return (
              <InboxSettingsGroupRow key={alias.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-medium">
                      {alias.address}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isLogin ? 'Mailbox login' : 'Sending alias'} ·{' '}
                      {alias.memberCount} member
                      {alias.memberCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <InboxSettingsTrailingSlot>
                    {alias.enabled ? (
                      <CheckIcon
                        className="size-4 text-foreground"
                        aria-label="Active"
                      />
                    ) : (
                      <span
                        className="text-center font-mono text-[8px] uppercase leading-tight tracking-wide text-muted-foreground"
                        title="Disabled"
                      >
                        Disabled
                      </span>
                    )}
                  </InboxSettingsTrailingSlot>
                </div>
              </InboxSettingsGroupRow>
            );
          })}
        </InboxSettingsGroupCard>
      ))}
    </div>
  );
}
