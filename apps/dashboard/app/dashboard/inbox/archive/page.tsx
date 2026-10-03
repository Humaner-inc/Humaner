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
    getMailThreads({ folder: 'archive' }),
    getMailTags(),
    getOrganizationMembers()
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <h1 className="sr-only">Archive</h1>

      <PullToRefreshInbox className="min-h-0 flex-1">
        {threads.length > 0 ? (
          <MailThreadList
            threads={threads}
            tags={tags}
            members={members.map(toAssigneePerson)}
            folderView="archive"
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
