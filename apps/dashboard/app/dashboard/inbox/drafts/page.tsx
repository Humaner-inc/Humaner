import * as React from 'react';

import { InboxMailFolderScreen } from '@/components/dashboard/inbox/inbox-mail-folder-screen';

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
      description="Unsent mail from this workspace."
      emptyTitle="No drafts"
      emptyDescription="Compose from an alias. Unsent mail will land here."
      mailbox={mailbox}
    />
  );
}
