import * as React from 'react';
import Link from 'next/link';

import { ConnectImapForm } from '@/components/dashboard/inbox/connect-imap-form';
import {
  InboxOptionalEmptyState,
  InboxUpgradeEmptyState
} from '@/components/dashboard/inbox/inbox-empty-state';
import { Routes } from '@/constants/routes';
import { getInboxOverview } from '@/data/inbox/get-inbox-overview';
import {
  getConnectedProviderPresetIds,
  getMailboxConnections
} from '@/data/inbox/get-mail-threads';

export default async function InboxProvidersPage(): Promise<React.JSX.Element> {
  const overview = await getInboxOverview();

  if (!overview || overview.locked) {
    return <InboxUpgradeEmptyState />;
  }

  if (!overview.canManageProviders) {
    return (
      <InboxOptionalEmptyState
        title="Workspace owner setup required"
        description="Only this workspace's owner can connect or change mail providers. You can still work aliases assigned to you."
        showConnect={false}
      />
    );
  }

  const [connectedProviderIds, connections] = await Promise.all([
    getConnectedProviderPresetIds(),
    getMailboxConnections()
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      {overview.hasConnections ? (
        <p className="font-mono text-xs text-muted-foreground">
          {overview.connectionCount} connection
          {overview.connectionCount === 1 ? '' : 's'} ·{' '}
          <Link
            href={Routes.InboxAliases}
            className="underline-offset-4 hover:underline"
          >
            Manage aliases
          </Link>
        </p>
      ) : null}

      <ConnectImapForm
        aliasLimit={overview.mailboxAliasLimit}
        aliasCount={overview.aliasCount}
        connectedProviderIds={connectedProviderIds}
        connections={connections}
      />
    </div>
  );
}
