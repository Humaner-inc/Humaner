import * as React from 'react';

import { InboxMailFolderScreen } from '@/components/dashboard/inbox/inbox-mail-folder-screen';

export default async function InboxSpamPage({
  searchParams
}: {
  searchParams: Promise<{ mailbox?: string }>;
}): Promise<React.JSX.Element> {
  const { mailbox } = await searchParams;
  return (
    <InboxMailFolderScreen
      folder="spam"
      title="Spam"
      description="Blocked senders land here. Mark as not spam to restore."
      emptyTitle="Spam is empty"
      emptyDescription="Mail from blocked senders will appear here."
      mailbox={mailbox}
    />
  );
}
