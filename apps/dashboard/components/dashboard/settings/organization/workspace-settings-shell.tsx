import * as React from 'react';

import {
  InboxOptionalEmptyState,
  InboxUpgradeEmptyState
} from '@/components/dashboard/inbox/inbox-empty-state';
import { InboxSettingsShell } from '@/components/dashboard/inbox/inbox-settings-tabs';
import { MailBlockList } from '@/components/dashboard/inbox/mail-block-list';
import { MailboxAliasGroups } from '@/components/dashboard/inbox/mailbox-alias-groups';
import { getBlockedSenders } from '@/data/inbox/get-blocked-senders';
import { getInboxOverview } from '@/data/inbox/get-inbox-overview';
import { getMailAliases } from '@/data/inbox/get-mail-aliases';
import { getMailboxConnections } from '@/data/inbox/get-mail-threads';

/**
 * Self-Host twin. Inbox aliases + identity. No Companion, Connect, or Data.
 */
export async function WorkspaceSettingsShell({
  children
}: {
  tab?: string;
  apps?: string;
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  const overview = await getInboxOverview();

  if (!overview || overview.locked) {
    return (
      <InboxSettingsShell
        initialTab="inbox"
        intros={{
          inbox: 'Connect a mailbox to manage aliases and blocked senders.',
          companion: '',
          connect: '',
          data: ''
        }}
        inbox={<InboxUpgradeEmptyState />}
        companion={null}
        connect={null}
        data={children}
      />
    );
  }

  const [aliases, blockedSenders, connections] = await Promise.all([
    getMailAliases(),
    getBlockedSenders(),
    getMailboxConnections()
  ]);

  const connectionByEmail = new Map(
    connections.map((connection) => [
      connection.email.trim().toLowerCase(),
      connection
    ])
  );

  const mailboxes = new Map<
    string,
    {
      connectionId: string;
      email: string;
      providerName: string;
      logoDomain: string;
      signatureText: string | null;
      signatureIconUrl: string | null;
      signatureIconHeight: number;
      aliases: typeof aliases;
    }
  >();

  for (const alias of aliases) {
    const key = `${alias.providerName}::${alias.connectionEmail}`;
    const connection = connectionByEmail.get(
      alias.connectionEmail.trim().toLowerCase()
    );
    const existing = mailboxes.get(key);
    if (existing) {
      existing.aliases.push(alias);
    } else {
      mailboxes.set(key, {
        connectionId: connection?.id ?? '',
        email: alias.connectionEmail,
        providerName: alias.providerName,
        logoDomain: alias.logoDomain,
        signatureText: connection?.signatureText ?? null,
        signatureIconUrl: connection?.signatureIconUrl ?? null,
        signatureIconHeight: connection?.signatureIconHeight ?? 48,
        aliases: [alias]
      });
    }
  }

  return (
    <InboxSettingsShell
      initialTab="inbox"
      intros={{
        inbox:
          'Aliases stay on your connected mailbox. Block senders to file their mail to Spam.',
        companion: '',
        connect: '',
        data: ''
      }}
      inbox={
        <div className="space-y-8">
          <div className="space-y-4">
            {!overview.hasConnections ? (
              <InboxOptionalEmptyState
                title="Connect an inbox first"
                description="Aliases live on a connected mailbox. Humaner does not create them."
              />
            ) : (
              <MailboxAliasGroups
                mailboxes={[...mailboxes.values()]}
                canManage={overview.canManageProviders}
              />
            )}
            <MailBlockList
              senders={blockedSenders}
              canManage={overview.canManageProviders}
            />
          </div>
          {children}
        </div>
      }
      companion={null}
      connect={null}
      data={null}
    />
  );
}
