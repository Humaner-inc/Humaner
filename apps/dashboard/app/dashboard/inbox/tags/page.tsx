import * as React from 'react';

import {
  InboxOptionalEmptyState,
  InboxUpgradeEmptyState
} from '@/components/dashboard/inbox/inbox-empty-state';
import { MailTagsSettings } from '@/components/dashboard/inbox/mail-tags-settings';
import { getInboxOverview } from '@/data/inbox/get-inbox-overview';
import { getMailAliases } from '@/data/inbox/get-mail-aliases';
import { getMailTags } from '@/data/inbox/get-mail-threads';

export default async function InboxTagsPage(): Promise<React.JSX.Element> {
  const overview = await getInboxOverview();

  if (!overview || overview.locked) {
    return <InboxUpgradeEmptyState />;
  }

  if (!overview.hasConnections) {
    return (
      <InboxOptionalEmptyState
        title="Connect a mailbox first"
        description="Tags color the unread circle on threads once mail is connected."
      />
    );
  }

  const [tags, aliases] = await Promise.all([getMailTags(), getMailAliases()]);

  return (
    <MailTagsSettings
      tags={tags}
      aliases={aliases.map((alias) => ({
        id: alias.id,
        address: alias.address
      }))}
      canManage={overview.canManageProviders}
    />
  );
}
