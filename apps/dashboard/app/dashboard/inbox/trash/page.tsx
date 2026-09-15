import * as React from 'react';

import { InboxMailFolderScreen } from '@/components/dashboard/inbox/inbox-mail-folder-screen';

export default async function InboxTrashPage({
  searchParams
}: {
  searchParams: Promise<{ mailbox?: string }>;
}): Promise<React.JSX.Element> {
  const { mailbox } = await searchParams;
  return (
    <InboxMailFolderScreen
      folder="trash"
      title="Trash"
      description="Deleted conversations. Delete again to remove them from the mailbox."
      emptyTitle="Trash is empty"
      emptyDescription="Deleted conversations will appear here."
      mailbox={mailbox}
    />
  );
}
