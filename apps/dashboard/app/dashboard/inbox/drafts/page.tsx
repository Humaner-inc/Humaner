import * as React from 'react';
import type { Metadata } from 'next';

import { InboxMailFolderScreen } from '@/components/dashboard/inbox/inbox-mail-folder-screen';
import { Routes } from '@/constants/routes';
import { createDashboardPageMetadata } from '@/lib/metadata/dashboard-metadata';

export const metadata: Metadata = createDashboardPageMetadata(
  Routes.InboxDrafts
);

export default async function InboxDraftsPage({
  searchParams
}: {
  searchParams: Promise<{ mailbox?: string }>;
}): Promise<React.JSX.Element> {
  const { mailbox } = await searchParams;
  return (
    <InboxMailFolderScreen
      folder="drafts"
      title="Drafts"
      emptyTitle="No drafts"
      emptyDescription="Compose from an alias. Unsent mail will land here."
      mailbox={mailbox}
    />
  );
}
