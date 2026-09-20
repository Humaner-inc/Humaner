import * as React from 'react';
import { Suspense } from 'react';

import { ConnectImapForm } from '@/components/dashboard/inbox/connect-imap-form';
import { GmailConnectToast } from '@/components/dashboard/inbox/gmail-connect-toast';
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
    return (
      <div className="p-6 md:p-8">
        <InboxUpgradeEmptyState />
      </div>
    );
  }

  if (!overview.canManageProviders) {
    return (
      <div className="p-6 md:p-8">
        <InboxOptionalEmptyState
          title="Admin setup required"
          description="Only workspace owners and admins can connect or change mail providers. You can still work aliases assigned to you."
          showConnect={false}
        />
      </div>
    );
  }

  const [connectedProviderIds, connections] = await Promise.all([
    getConnectedProviderPresetIds(),
    getMailboxConnections()
  ]);

  return (
    <>
      <Suspense fallback={null}>
        <GmailConnectToast />
      </Suspense>
      <ConnectImapForm
        inboxLimit={overview.mailboxAliasLimit}
        connectionCount={overview.connectionCount}
        connectedProviderIds={connectedProviderIds}
        connections={connections}
      />
    </>
  );
}
