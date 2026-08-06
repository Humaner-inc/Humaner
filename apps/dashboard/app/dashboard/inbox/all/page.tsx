import * as React from 'react';

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

function parseFilter(value: string | undefined): InboxListFilter {
  if (value === 'unread' || value === 'open' || value === 'pending') {
    return value;
  }
  return 'all';
}

export default async function InboxAllPage({
  searchParams
}: {
  searchParams: Promise<{
    alias?: string;
    filter?: string;
    tag?: string;
    compose?: string;
  }>;
}): Promise<React.JSX.Element> {
  const overview = await getInboxOverview();
  const {
    alias: aliasParam,
    filter: filterParam,
    tag: tagParam,
    compose: composeParam
  } = await searchParams;
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
          description="Connect IMAP or Gmail when you want shared support aliases in Humaner. Until then, agents and Desk work as usual."
        />
      </div>
    );
  }

  const [inboxes, tags, members] = await Promise.all([
    getMailInboxes(),
    getMailTags(),
    getOrganizationMembers()
  ]);

  const activeAliasId =
    aliasParam && inboxes.some((inbox) => inbox.id === aliasParam)
      ? aliasParam
      : null;

  const activeTagId =
    tagParam && tags.some((tag) => tag.id === tagParam) ? tagParam : null;

  const threads = await getMailThreads({
    aliasId: activeAliasId,
    tagId: activeTagId,
    unreadOnly: !activeTagId && activeFilter === 'unread',
    status:
      !activeTagId && activeFilter === 'open'
        ? 'OPEN'
        : !activeTagId && activeFilter === 'pending'
          ? 'PENDING'
          : undefined
  });

  if (threads.length === 0) {
    return (
      <div className="-m-6 flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col overflow-hidden md:-m-8">
        <div className="shrink-0 border-b border-border/50 px-4 py-3">
          <InboxListHeader
            activeFilter={activeFilter}
            activeTagId={activeTagId}
            activeAliasId={activeAliasId}
            tags={tags}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-6">
          <InboxOptionalEmptyState
            title="No threads yet"
            description="Sync to import recent messages for your aliases."
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
      activeAliasId={activeAliasId}
      activeFilter={activeFilter}
      activeTagId={activeTagId}
      autoCompose={autoCompose}
    />
  );
}
