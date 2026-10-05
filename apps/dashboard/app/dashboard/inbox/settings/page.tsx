import * as React from 'react';

import { CompanionWorkspaceSettings } from '@/components/dashboard/inbox/companion-workspace-settings';
import {
  InboxOptionalEmptyState,
  InboxUpgradeEmptyState
} from '@/components/dashboard/inbox/inbox-empty-state';
import {
  InboxSettingsTabs,
  type WorkspaceSettingsTab
} from '@/components/dashboard/inbox/inbox-settings-tabs';
import { MailBlockList } from '@/components/dashboard/inbox/mail-block-list';
import { MailboxAliasGroups } from '@/components/dashboard/inbox/mailbox-alias-groups';
import { WorkspaceConnectApps } from '@/components/dashboard/inbox/workspace-connect-apps';
import { WorkspaceSettingsIntro } from '@/components/dashboard/inbox/workspace-settings-intro';
import { WorkspaceSettingsPanel } from '@/components/dashboard/settings/organization/workspace-settings-panel';
import { getCompanionWorkspaceRights } from '@/data/inbox/companion-rights';
import { getBlockedSenders } from '@/data/inbox/get-blocked-senders';
import { getInboxOverview } from '@/data/inbox/get-inbox-overview';
import { getMailAliases } from '@/data/inbox/get-mail-aliases';
import { getMailboxConnections } from '@/data/inbox/get-mail-threads';
import { normalizeCompanionIntegrations } from '@/lib/inbox/companion-rights';

function resolveWorkspaceTab(value: string | undefined): WorkspaceSettingsTab {
  if (value === 'companion') return 'companion';
  if (value === 'inbox' || value === 'aliases') return 'inbox';
  if (value === 'settings') return 'settings';
  return 'connect';
}

export default async function InboxSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string; apps?: string }>;
}): Promise<React.JSX.Element> {
  const params = await searchParams;
  const tab = resolveWorkspaceTab(params.tab);
  // Apps picked during onboarding still need their OAuth grant.
  const pendingApps = normalizeCompanionIntegrations(
    params.apps?.split(',') ?? []
  );

  const overview = await getInboxOverview();

  if (!overview || overview.locked) {
    return <InboxUpgradeEmptyState />;
  }

  if (tab === 'settings') {
    return (
      <div className="space-y-6">
        <InboxSettingsTabs active="settings" />
        <WorkspaceSettingsIntro text="Workspace name, address, and the id teammates use to join this mailbox." />
        <WorkspaceSettingsPanel />
      </div>
    );
  }

  const [aliases, rights, blockedSenders, connections] = await Promise.all([
    getMailAliases(),
    getCompanionWorkspaceRights(),
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

  const intro =
    tab === 'companion'
      ? 'What Companion may draft, assign, or send, and whether action chips appear above the composer.'
      : tab === 'inbox'
        ? `Humaner detect aliases for your inbox so you can use them while sending emails. Block senders to file their mail to Spam.`
        : overview.canManageProviders
          ? 'Activate Linear, Stripe, or GitHub through Humaner.'
          : 'Activate Linear, Stripe, or GitHub through Humaner. Only the workspace owner can change this.';

  return (
    <div className="space-y-6">
      <InboxSettingsTabs active={tab} />

      <WorkspaceSettingsIntro text={intro} />

      {tab === 'connect' ? (
        <WorkspaceConnectApps
          integrations={rights.integrations}
          canManage={overview.canManageProviders}
          pending={pendingApps}
        />
      ) : tab === 'companion' ? (
        <CompanionWorkspaceSettings
          actions={rights.actions}
          autoSuggestReplies={overview.autoSuggestReplies}
          actionSuggestions={rights.actionSuggestions}
          canManage={overview.canManageProviders}
        />
      ) : (
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
      )}
    </div>
  );
}
