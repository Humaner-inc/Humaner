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
import type { MailListFolder } from '@/lib/inbox/mail-thread-folder-shared';

export async function InboxMailFolderScreen({
  folder,
  title,
  description,
  emptyTitle,
  emptyDescription,
  mailbox
}: {
  folder: MailListFolder;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  mailbox?: string;
}): Promise<React.JSX.Element> {
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
    getMailThreads({
      folder,
      connectionId: mailbox ?? null
    }),
    getMailTags(),
    getOrganizationMembers()
  ]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <PullToRefreshInbox className="min-h-0 flex-1">
        {threads.length > 0 ? (
          <MailThreadList
            variant="desk"
            threads={threads}
            tags={tags}
            members={members.map(toAssigneePerson)}
            folderView={folder}
            listChrome={
              <div className="px-4 py-3">
                <h1 className="page-title">{title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            }
          />
        ) : (
          <div className="p-6 md:p-8">
            <InboxOptionalEmptyState
              title={emptyTitle}
              description={emptyDescription}
              showConnect={false}
            />
          </div>
        )}
      </PullToRefreshInbox>
    </div>
  );
}
