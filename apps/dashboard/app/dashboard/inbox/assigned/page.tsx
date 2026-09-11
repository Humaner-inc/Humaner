import * as React from 'react';

import {
  InboxOptionalEmptyState,
  InboxUpgradeEmptyState
} from '@/components/dashboard/inbox/inbox-empty-state';
import { MailThreadList } from '@/components/dashboard/inbox/mail-thread-list';
import { toAssigneePerson } from '@/components/ui/assignees';
import { getInboxOverview } from '@/data/inbox/get-inbox-overview';
import { getMailTags, getMailThreads } from '@/data/inbox/get-mail-threads';
import { getOrganizationMembers } from '@/data/members/get-organization-members';

export default async function InboxAssignedPage(): Promise<React.JSX.Element> {
  const overviewPromise = getInboxOverview();
  const listPromise = Promise.all([
    getMailThreads({ assignedToCurrentUser: true }),
    getMailTags(),
    getOrganizationMembers()
  ]);

  const overview = await overviewPromise;

  if (!overview || overview.locked) {
    return (
      <div className="p-6 md:p-8">
        <InboxUpgradeEmptyState />
      </div>
    );
  }

  if (!overview.hasConnections) {
    return (
      <div className="p-6 md:p-8">
        <InboxOptionalEmptyState />
      </div>
    );
  }

  const [threads, tags, members] = await listPromise;

  return (
    <MailThreadList
      variant="desk"
      threads={threads}
      tags={tags}
      members={members.map(toAssigneePerson)}
      listChrome={
        <div className="space-y-1 px-3 py-3">
          <h1 className="page-title">Assigned to me</h1>
          <p className="text-xs text-muted-foreground">
            Conversations assigned to you.
          </p>
        </div>
      }
    />
  );
}
