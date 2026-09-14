import * as React from 'react';

import {
  InboxOptionalEmptyState,
  InboxUpgradeEmptyState
} from '@/components/dashboard/inbox/inbox-empty-state';
import { MailThreadList } from '@/components/dashboard/inbox/mail-thread-list';
import { PullToRefreshInbox } from '@/components/dashboard/inbox/pull-to-refresh-inbox';
import { toAssigneePerson } from '@/components/ui/assignees';
import { getInboxOverview } from '@/data/inbox/get-inbox-overview';
import { getMailTags, getMailThreads } from '@/data/inbox/get-mail-threads';
import { getOrganizationMembers } from '@/data/members/get-organization-members';

export default async function InboxArchivePage(): Promise<React.JSX.Element> {
  const overview = await getInboxOverview();

  if (!overview || overview.locked) {
    return <InboxUpgradeEmptyState />;
  }

  if (!overview.hasConnections) {
    return <InboxOptionalEmptyState />;
  }

  const [threads, tags, members] = await Promise.all([
    getMailThreads({ archived: true }),
    getMailTags(),
    getOrganizationMembers()
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="shrink-0">
        <h1 className="page-title">Archive</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Archived conversations. Restore them to the inbox from the row menu.
        </p>
      </div>

      <PullToRefreshInbox className="min-h-0 flex-1">
        {threads.length > 0 ? (
          <MailThreadList
            threads={threads}
            tags={tags}
            members={members.map(toAssigneePerson)}
            archivedView
          />
        ) : (
          <InboxOptionalEmptyState
            title="Archive is empty"
            description="Archived threads will appear here."
            showConnect={false}
          />
        )}
      </PullToRefreshInbox>
    </div>
  );
}
