import * as React from 'react';

import { InboxMailFolderScreen } from '@/components/dashboard/inbox/inbox-mail-folder-screen';

export default async function InboxSentPage({
  searchParams
}: {
  searchParams: Promise<{ mailbox?: string }>;
}): Promise<React.JSX.Element> {
  const { mailbox } = await searchParams;
  return (
    <InboxMailFolderScreen
      folder="sent"
      title="Sent"
      description="Emails you sent from this workspace."
      emptyTitle="No sent mail"
      emptyDescription="Messages you send will appear here."
      mailbox={mailbox}
    />
  );
}
