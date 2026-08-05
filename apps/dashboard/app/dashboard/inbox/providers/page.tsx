import * as React from 'react';

import { ConnectImapForm } from '@/components/dashboard/inbox/connect-imap-form';
import {
  InboxOptionalEmptyState,
  InboxUpgradeEmptyState
} from '@/components/dashboard/inbox/inbox-empty-state';
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
    <ConnectImapForm
      aliasLimit={overview.mailboxAliasLimit}
      aliasCount={overview.aliasCount}
      connectedProviderIds={connectedProviderIds}
      connections={connections}
    />
  );
}
