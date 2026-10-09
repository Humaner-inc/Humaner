import * as React from 'react';
import type { Metadata } from 'next';

import { InboxMailFolderScreen } from '@/components/dashboard/inbox/inbox-mail-folder-screen';
import { InboxPageLoader } from '@/components/dashboard/inbox/inbox-page-loader';
import { Routes } from '@/constants/routes';
import { createDashboardPageMetadata } from '@/lib/metadata/dashboard-metadata';

export const metadata: Metadata = createDashboardPageMetadata(
  Routes.InboxDrafts
);

async function InboxDraftsPageContent({
  searchParams
}: {
  searchParams: Promise<{ mailbox?: string; q?: string }>;
}): Promise<React.JSX.Element> {
  const { mailbox, q } = await searchParams;
  return (
    <InboxMailFolderScreen
      folder="drafts"
      title="Drafts"
      emptyTitle="No drafts"
      emptyDescription="Compose from an alias. Unsent mail will land here."
      mailbox={mailbox}
      query={q}
    />
  );
}

export default function InboxDraftsPage({
  searchParams
}: {
  searchParams: Promise<{ mailbox?: string; q?: string }>;
}): React.JSX.Element {
  return (
    <React.Suspense fallback={<InboxPageLoader />}>
      <InboxDraftsPageContent searchParams={searchParams} />
    </React.Suspense>
  );
}
