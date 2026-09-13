import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { ArrowLeftIcon } from '@humaner/shared/icons';

import { MailThreadDetail } from '@/components/dashboard/inbox/mail-thread-detail';
import { toAssigneePerson } from '@/components/ui/assignees';
import { Routes } from '@/constants/routes';
import { getMailTags, getMailThread } from '@/data/inbox/get-mail-threads';
import { getOrganizationMembers } from '@/data/members/get-organization-members';

function InboxThreadFallback(): React.JSX.Element {
  return (
    <div className="space-y-4 p-6">
      <div className="h-4 w-20 animate-pulse rounded-md bg-muted/40" />
      <div className="h-48 animate-pulse rounded-md bg-muted/40" />
    </div>
  );
}

async function InboxThreadPageContent({
  params
}: {
  params: Promise<{ threadId: string }>;
}): Promise<React.JSX.Element> {
  await connection();
  const { threadId } = await params;
  const [thread, tags, members] = await Promise.all([
    getMailThread(threadId),
    getMailTags(),
    getOrganizationMembers()
  ]);

  if (!thread) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <Link
        href={Routes.InboxAll}
        className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        Inbox
      </Link>
      <MailThreadDetail
        thread={thread}
        tags={tags}
        members={members.map(toAssigneePerson)}
      />
    </div>
  );
}

export default function InboxThreadPage({
  params
}: {
  params: Promise<{ threadId: string }>;
}): React.JSX.Element {
  return (
    <React.Suspense fallback={<InboxThreadFallback />}>
      <InboxThreadPageContent params={params} />
    </React.Suspense>
  );
}
