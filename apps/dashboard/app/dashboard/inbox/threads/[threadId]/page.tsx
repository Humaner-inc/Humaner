import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeftIcon } from '@humaner/shared/icons';

import { MailThreadDetail } from '@/components/dashboard/inbox/mail-thread-detail';
import { Routes } from '@/constants/routes';
import { getMailTags, getMailThread } from '@/data/inbox/get-mail-threads';
import { getOrganizationMembers } from '@/data/members/get-organization-members';

export default async function InboxThreadPage({
  params
}: {
  params: Promise<{ threadId: string }>;
}): Promise<React.JSX.Element> {
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
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Link
        href={Routes.InboxAll}
        className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        All mail
      </Link>
      <MailThreadDetail
        thread={thread}
        tags={tags}
        members={members.map((member) => ({
          id: member.id,
          name: member.name
        }))}
      />
    </div>
  );
}
