import * as React from 'react';

import {
  InboxOptionalEmptyState,
  InboxUpgradeEmptyState
} from '@/components/dashboard/inbox/inbox-empty-state';
import { InboxFolderMailList } from '@/components/dashboard/inbox/inbox-folder-mail-list';
import { MailThreadList } from '@/components/dashboard/inbox/mail-thread-list';
import { PullToRefreshInbox } from '@/components/dashboard/inbox/pull-to-refresh-inbox';
import { SpamFolderToolbar } from '@/components/dashboard/inbox/spam-folder-toolbar';
import { TrashFolderToolbar } from '@/components/dashboard/inbox/trash-folder-toolbar';
import { toAssigneePerson } from '@/components/ui/assignees';
import { getInboxOverview } from '@/data/inbox/get-inbox-overview';
import {
  getMailInboxes,
  getMailTags,
  getMailThreads
} from '@/data/inbox/get-mail-threads';
import { getOrganizationMembers } from '@/data/members/get-organization-members';
import { groupMailInboxes } from '@/lib/inbox/mail-inbox-groups';
import type { MailListFolder } from '@/lib/inbox/mail-thread-folder-shared';

/** Folders that share the All inbox chrome: mailbox switcher, compose, search, select. */
const UNIFIED_FOLDERS: ReadonlySet<MailListFolder> = new Set([
  'drafts',
  'sent',
  'archive'
]);

export async function InboxMailFolderScreen({
  folder,
  title,
  emptyTitle,
  emptyDescription,
  mailbox,
  query
}: {
  folder: MailListFolder;
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  mailbox?: string;
  query?: string;
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

  if (UNIFIED_FOLDERS.has(folder)) {
    const search = query?.trim() || null;
    const inboxes = await getMailInboxes();
    const mailboxes = groupMailInboxes(inboxes);
    const activeMailboxId =
      mailbox && mailboxes.some((item) => item.connectionId === mailbox)
        ? mailbox
        : (mailboxes[0]?.connectionId ?? null);
    const [threads, tags, members] = await Promise.all([
      getMailThreads({ folder, connectionId: activeMailboxId, search }),
      getMailTags(),
      getOrganizationMembers()
    ]);

    return (
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <h1 className="sr-only">{title}</h1>
        <PullToRefreshInbox className="min-h-0 flex-1">
          <InboxFolderMailList
            folder={folder}
            threads={threads}
            tags={tags}
            members={members.map(toAssigneePerson)}
            inboxes={inboxes}
            activeMailboxId={activeMailboxId}
            emptyLabel={
              search ? `No mail matches “${search}”` : emptyDescription
            }
          />
        </PullToRefreshInbox>
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

  const listChrome =
    folder === 'trash' ? (
      <TrashFolderToolbar
        retention={overview.trashRetention}
        mailbox={mailbox ?? null}
        canEmpty={threads.length > 0}
      />
    ) : folder === 'spam' ? (
      <SpamFolderToolbar
        mailbox={mailbox ?? null}
        canEmpty={threads.length > 0}
      />
    ) : null;

  const hasFolderChrome = folder === 'trash' || folder === 'spam';

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {hasFolderChrome ? null : <h1 className="sr-only">{title}</h1>}
      <PullToRefreshInbox className="min-h-0 flex-1">
        {threads.length > 0 ? (
          <MailThreadList
            variant="desk"
            threads={threads}
            tags={tags}
            members={members.map(toAssigneePerson)}
            folderView={folder}
            listChrome={listChrome}
          />
        ) : (
          <div className="flex h-full min-h-0 flex-1 flex-col">
            {hasFolderChrome ? (
              <div className="shrink-0 border-b border-border/50">
                {listChrome}
              </div>
            ) : null}
            <div className="p-6 md:p-8">
              <InboxOptionalEmptyState
                title={emptyTitle}
                description={emptyDescription}
                showConnect={false}
              />
            </div>
          </div>
        )}
      </PullToRefreshInbox>
    </div>
  );
}
