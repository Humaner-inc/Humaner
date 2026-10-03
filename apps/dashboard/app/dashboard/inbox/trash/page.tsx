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
      emptyTitle="Trash is empty"
      emptyDescription="Deleted conversations will appear here until auto-empty or you empty the bin."
      mailbox={mailbox}
    />
  );
}
