import * as React from 'react';
import { connection } from 'next/server';

import { InboxAllMailList } from '@/components/dashboard/inbox/inbox-all-mail-list';
import {
  InboxOptionalEmptyState,
  InboxUpgradeEmptyState
} from '@/components/dashboard/inbox/inbox-empty-state';
import {
  InboxListHeader,
  type InboxListFilter
} from '@/components/dashboard/inbox/inbox-list-header';
import { getInboxOverview } from '@/data/inbox/get-inbox-overview';
import {
  getMailInboxes,
  getMailTags,
  getMailThreads
} from '@/data/inbox/get-mail-threads';
import { getOrganizationMembers } from '@/data/members/get-organization-members';
import { groupMailInboxes } from '@/lib/inbox/mail-inbox-groups';

function parseFilter(value: string | undefined): InboxListFilter {
  if (value === 'unread' || value === 'open' || value === 'pending') {
    return value;
  }
  return 'all';
}

function InboxAllFallback(): React.JSX.Element {
  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col gap-4 p-6"
      data-dashboard-page-shell="inbox"
    >
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted/40" />
      <div className="h-32 animate-pulse rounded-md bg-muted/40" />
      <div className="h-32 animate-pulse rounded-md bg-muted/40" />
    </div>
  );
}

async function InboxAllPageContent({
  searchParams
}: {
  searchParams: Promise<{
    mailbox?: string;
    alias?: string;
    filter?: string;
    tag?: string;
    compose?: string;
  }>;
}): Promise<React.JSX.Element> {
  await connection();
  const overviewPromise = getInboxOverview();
  const inboxesPromise = getMailInboxes();
  const tagsPromise = getMailTags();
  const membersPromise = getOrganizationMembers();

  const [
    {
      mailbox: mailboxParam,
      alias: aliasParam,
      filter: filterParam,
      tag: tagParam,
      compose: composeParam
    },
    overview
  ] = await Promise.all([searchParams, overviewPromise]);
  const activeFilter = parseFilter(filterParam);
  const autoCompose = composeParam === '1' || composeParam === 'true';

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
        <InboxOptionalEmptyState
          title="No mail connected yet"
          description="Connect your email provider to start using the inbox."
        />
      </div>
    );
  }

  const [inboxes, tags, members] = await Promise.all([
    inboxesPromise,
    tagsPromise,
    membersPromise
  ]);

  const mailboxes = groupMailInboxes(inboxes);
  const activeMailboxId =
    mailboxParam &&
    mailboxes.some((mailbox) => mailbox.connectionId === mailboxParam)
      ? mailboxParam
      : (mailboxes[0]?.connectionId ?? null);

  const threads = await getMailThreads({
    connectionId: activeMailboxId,
    aliasId: activeMailboxId ? null : (aliasParam ?? null),
    tagId: tagParam ?? null,
    unreadOnly: !tagParam && activeFilter === 'unread',
    status:
      !tagParam && activeFilter === 'open'
        ? 'OPEN'
        : !tagParam && activeFilter === 'pending'
          ? 'PENDING'
          : undefined
  });

  const activeTagId =
    tagParam && tags.some((tag) => tag.id === tagParam) ? tagParam : null;

  if (threads.length === 0) {
    return (
      <div className="-m-6 flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col overflow-hidden md:-m-8">
        <div className="shrink-0 border-b border-border/50 px-4 py-3">
          <InboxListHeader
            activeFilter={activeFilter}
            activeTagId={activeTagId}
            activeMailboxId={activeMailboxId}
            tags={tags}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-6">
          <InboxOptionalEmptyState
            title="No threads yet"
            description="Sync to import recent messages for this inbox."
            showConnect={false}
          />
        </div>
      </div>
    );
  }

  return (
    <InboxAllMailList
      threads={threads}
      tags={tags}
      members={members.map((member) => ({
        id: member.id,
        name: member.name
      }))}
      inboxes={inboxes}
      activeMailboxId={activeMailboxId}
      activeFilter={activeFilter}
      activeTagId={activeTagId}
      autoCompose={autoCompose}
    />
  );
}

export default function InboxAllPage({
  searchParams
}: {
  searchParams: Promise<{
    mailbox?: string;
    alias?: string;
    filter?: string;
    tag?: string;
    compose?: string;
  }>;
}): React.JSX.Element {
  return (
    <React.Suspense fallback={<InboxAllFallback />}>
      <InboxAllPageContent searchParams={searchParams} />
    </React.Suspense>
  );
}
