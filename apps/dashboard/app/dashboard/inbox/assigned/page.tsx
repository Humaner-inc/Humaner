import * as React from 'react';

import {
  InboxOptionalEmptyState,
  InboxUpgradeEmptyState
} from '@/components/dashboard/inbox/inbox-empty-state';
import { MailThreadList } from '@/components/dashboard/inbox/mail-thread-list';
import { getInboxOverview } from '@/data/inbox/get-inbox-overview';
import { getMailTags, getMailThreads } from '@/data/inbox/get-mail-threads';
import { getOrganizationMembers } from '@/data/members/get-organization-members';

export default async function InboxAssignedPage(): Promise<React.JSX.Element> {
  const overview = await getInboxOverview();

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

  const [threads, tags, members] = await Promise.all([
    getMailThreads({ assignedToCurrentUser: true }),
    getMailTags(),
    getOrganizationMembers()
  ]);

  if (threads.length === 0) {
    return (
      <div className="-m-6 flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col overflow-hidden md:-m-8">
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
      members={members.map((member) => ({
        id: member.id,
        name: member.name
      }))}
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
