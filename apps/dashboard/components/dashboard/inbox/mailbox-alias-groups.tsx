'use client';

import * as React from 'react';
import { CheckIcon } from '@humaner/shared/icons';

import {
  InboxSettingsGroupCard,
  InboxSettingsGroupRow,
  InboxSettingsTrailingSlot
} from '@/components/dashboard/inbox/inbox-settings-group-card';
import {
  MailboxSignatureDialog,
  type MailboxSignatureTarget
} from '@/components/dashboard/inbox/mailbox-signature-dialog';
import { Button } from '@/components/ui/button';
import type { MailAliasListItem } from '@/data/inbox/get-mail-aliases';

export type MailboxAliasGroup = {
  connectionId: string;
  email: string;
  providerName: string;
  logoDomain: string;
  signatureText: string | null;
  signatureIconUrl: string | null;
  aliases: MailAliasListItem[];
};

function signatureSummary(mailbox: MailboxAliasGroup): string {
  const parts: string[] = [];
  if (mailbox.signatureIconUrl) {
    parts.push('Icon');
  }
  const text = mailbox.signatureText?.trim();
  if (text) {
    const line = text.split(/\r?\n/)[0]?.trim() ?? '';
    parts.push(line.length > 48 ? `${line.slice(0, 48)}…` : line);
  }
  return parts.length > 0 ? parts.join(' · ') : 'None';
}

export function MailboxAliasGroups({
  mailboxes,
  canManage = true
}: {
  mailboxes: MailboxAliasGroup[];
  canManage?: boolean;
}): React.JSX.Element {
  const [pendingSignature, setPendingSignature] =
    React.useState<MailboxSignatureTarget | null>(null);

  const openSignature = (mailbox: MailboxAliasGroup): void => {
    setPendingSignature({
      id: mailbox.connectionId,
      email: mailbox.email,
      signatureText: mailbox.signatureText,
      signatureIconUrl: mailbox.signatureIconUrl
    });
  };

  return (
    <>
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
            <InboxSettingsGroupRow>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Email signature</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {signatureSummary(mailbox)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 rounded-lg px-2 font-mono text-[10px]"
                  disabled={!canManage}
                  onClick={() => openSignature(mailbox)}
                >
                  {mailbox.signatureText?.trim() || mailbox.signatureIconUrl
                    ? 'Edit'
                    : 'Add'}
                </Button>
              </div>
            </InboxSettingsGroupRow>
          </InboxSettingsGroupCard>
        ))}
      </div>
      <MailboxSignatureDialog
        connection={pendingSignature}
        open={pendingSignature != null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setPendingSignature(null);
          }
        }}
      />
    </>
  );
}
