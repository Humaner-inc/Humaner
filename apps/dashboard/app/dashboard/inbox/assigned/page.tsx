import * as React from 'react';

import {
  InboxOptionalEmptyState,
  InboxUpgradeEmptyState
} from '@/components/dashboard/inbox/inbox-empty-state';
import { MailThreadList } from '@/components/dashboard/inbox/mail-thread-list';
import { PullToRefreshInbox } from '@/components/dashboard/inbox/pull-to-refresh-inbox';
import { getInboxOverview } from '@/data/inbox/get-inbox-overview';
import { getMailTags, getMailThreads } from '@/data/inbox/get-mail-threads';
import { getOrganizationMembers } from '@/data/members/get-organization-members';

export default async function InboxAssignedPage(): Promise<React.JSX.Element> {
  const overview = await getInboxOverview();

  if (!overview || overview.locked) {
    return <InboxUpgradeEmptyState />;
  }

  if (!overview.hasConnections) {
    return <InboxOptionalEmptyState />;
  }

  const [threads, tags, members] = await Promise.all([
    getMailThreads({ assignedToCurrentUser: true }),
    getMailTags(),
    getOrganizationMembers()
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Assigned to me
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conversations assigned to you. Pull down or tap to sync.
        </p>
      </div>

      <PullToRefreshInbox>
        {threads.length > 0 ? (
          <MailThreadList
            threads={threads}
            tags={tags}
            members={members.map((member) => ({
              id: member.id,
              name: member.name
            }))}
          />
        ) : (
          <InboxOptionalEmptyState
            title="Nothing assigned to you"
            description="Threads assigned to you will show up here."
            showConnect={false}
          />
        )}
      </PullToRefreshInbox>
    </div>
  );
}
