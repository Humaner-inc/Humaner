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
import { DASHBOARD_FULL_BLEED_HEIGHT_CLASS } from '@/lib/companion-visibility';
import { cn } from '@/lib/utils';

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

  if (threads.length === 0) {
    return (
      <div
        className={cn(
          '-m-6 flex min-h-0 flex-col overflow-hidden md:-m-8',
          DASHBOARD_FULL_BLEED_HEIGHT_CLASS
        )}
      >
        <div className="shrink-0 space-y-1 border-b border-border/50 px-4 py-3">
          <h1 className="page-title">Assigned to me</h1>
          <p className="text-sm text-muted-foreground">
            Conversations assigned to you.
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-6">
          <InboxOptionalEmptyState
            title="Nothing assigned to you"
            description="Threads assigned to you will show up here."
            showConnect={false}
          />
        </div>
      </div>
    );
  }

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
