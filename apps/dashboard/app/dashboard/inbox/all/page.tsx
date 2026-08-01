import * as React from 'react';
import { Suspense } from 'react';

import { ComposeMailButton } from '@/components/dashboard/inbox/compose-mail-button';
import { InboxAllMailList } from '@/components/dashboard/inbox/inbox-all-mail-list';
import { InboxDomainSwitcher } from '@/components/dashboard/inbox/inbox-domain-switcher';
import {
  InboxOptionalEmptyState,
  InboxUpgradeEmptyState
} from '@/components/dashboard/inbox/inbox-empty-state';
import {
  InboxListHeader,
  type InboxListFilter
} from '@/components/dashboard/inbox/inbox-list-header';
import { PullToRefreshInbox } from '@/components/dashboard/inbox/pull-to-refresh-inbox';
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
    return <InboxUpgradeEmptyState />;
  }

  if (!overview.hasConnections) {
    return (
      <InboxOptionalEmptyState
        title="No mail connected yet"
        description="Connect IMAP or Gmail when you want shared support aliases in Humaner. Until then, agents and Desk work as usual."
      />
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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            All mail
          </h1>
          <ComposeMailButton
            inboxes={inboxes}
            defaultAliasId={activeAliasId}
            autoOpen={autoCompose}
          />
        </div>
        <InboxDomainSwitcher
          inboxes={inboxes}
          activeAliasId={activeAliasId}
        />
      </div>

      <Suspense
        fallback={<div className="h-11 rounded-lg border bg-background" />}
      >
        {threads.length > 0 ? (
          <PullToRefreshInbox className="min-h-0 flex-1">
            <InboxAllMailList
              threads={threads}
              tags={tags}
              members={members.map((member) => ({
                id: member.id,
                name: member.name
              }))}
              activeFilter={activeFilter}
              activeTagId={activeTagId}
            />
          </PullToRefreshInbox>
        ) : (
          <>
            <InboxListHeader
              activeFilter={activeFilter}
              activeTagId={activeTagId}
              tags={tags}
            />
            <PullToRefreshInbox>
              <InboxOptionalEmptyState
                title="No threads yet"
                description="Tap sync in the header to import recent messages for your aliases."
                showConnect={false}
              />
            </PullToRefreshInbox>
          </>
        )}
      </Suspense>
    </div>
  );
}
