import * as React from 'react';

import { InboxAllMailList } from '@/components/dashboard/inbox/inbox-all-mail-list';
import {
  InboxOptionalEmptyState,
  InboxUpgradeEmptyState
} from '@/components/dashboard/inbox/inbox-empty-state';
import { type InboxListFilter } from '@/components/dashboard/inbox/inbox-list-header';
import { InboxPageLoader } from '@/components/dashboard/inbox/inbox-page-loader';
import { toAssigneePerson } from '@/components/ui/assignees';
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

async function InboxAllPageContent({
  searchParams
}: {
  searchParams: Promise<{
    mailbox?: string;
    alias?: string;
    filter?: string;
    tag?: string;
    compose?: string;
    thread?: string;
    outbound?: string;
    wave?: string;
  }>;
}): Promise<React.JSX.Element> {
  const {
    mailbox: mailboxParam,
    alias: aliasParam,
    filter: filterParam,
    tag: tagParam,
    compose: composeParam,
    outbound: outboundParam,
    wave: waveParam
  } = await searchParams;
  const activeFilter = parseFilter(filterParam);
  const autoCompose = composeParam === '1' || composeParam === 'true';
  const outboundOnly = outboundParam === '1' || outboundParam === 'true';

  let waveTagId: string | null = tagParam ?? null;
  if (!waveTagId && waveParam && outboundOnly) {
    const { prisma } = await import('@/lib/db/prisma');
    const { dedupedAuth } = await import('@/lib/auth');
    const { checkSession } = await import('@/lib/auth/session');
    const session = await dedupedAuth();
    if (checkSession(session) && session.user.organizationId) {
      const wave = await prisma.outboundWave.findFirst({
        where: {
          id: waveParam,
          organizationId: session.user.organizationId
        },
        select: { mailTagId: true }
      });
      waveTagId = wave?.mailTagId ?? null;
    }
  }

  const threadFilters = {
    aliasId: mailboxParam ? null : (aliasParam ?? null),
    tagId: waveTagId,
    outboundOnly: outboundOnly && !waveTagId,
    unreadOnly: !waveTagId && !outboundOnly && activeFilter === 'unread',
    status:
      !waveTagId && !outboundOnly && activeFilter === 'open'
        ? ('OPEN' as const)
        : !waveTagId && !outboundOnly && activeFilter === 'pending'
          ? ('PENDING' as const)
          : undefined
  };

  const [overview, inboxes, tags, members, threads] = await Promise.all([
    getInboxOverview(),
    getMailInboxes(),
    getMailTags(),
    getOrganizationMembers(),
    getMailThreads(threadFilters)
  ]);

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

  const mailboxes = groupMailInboxes(inboxes);
  const requestedMailboxValid = Boolean(
    mailboxParam &&
      mailboxes.some((mailbox) => mailbox.connectionId === mailboxParam)
  );
  const activeMailboxId = requestedMailboxValid
    ? mailboxParam!
    : (mailboxes[0]?.connectionId ?? null);

  const aliasIds = new Set(
    inboxes
      .filter((inbox) => inbox.connectionId === activeMailboxId)
      .map((inbox) => inbox.id)
  );
  const visibleThreads = !activeMailboxId
    ? threads
    : threads.filter((thread) => aliasIds.has(thread.aliasId));

  const activeTagId =
    tagParam && tags.some((tag) => tag.id === tagParam) ? tagParam : null;

  return (
    <InboxAllMailList
      threads={visibleThreads}
      tags={tags}
      members={members.map(toAssigneePerson)}
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
    thread?: string;
  }>;
}): React.JSX.Element {
  return (
    <React.Suspense fallback={<InboxPageLoader />}>
      <InboxAllPageContent searchParams={searchParams} />
    </React.Suspense>
  );
}
