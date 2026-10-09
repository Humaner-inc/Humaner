import * as React from 'react';

import { InboxMailFolderScreen } from '@/components/dashboard/inbox/inbox-mail-folder-screen';
import { InboxPageLoader } from '@/components/dashboard/inbox/inbox-page-loader';

async function InboxSpamPageContent({
  searchParams
}: {
  searchParams: Promise<{ mailbox?: string }>;
}): Promise<React.JSX.Element> {
  const { mailbox } = await searchParams;
  return (
    <InboxMailFolderScreen
      folder="spam"
      title="Spam"
      emptyTitle="Spam is empty"
      emptyDescription="Mail from blocked senders will appear here."
      mailbox={mailbox}
    />
  );
}

export default function InboxSpamPage({
  searchParams
}: {
  searchParams: Promise<{ mailbox?: string }>;
}): React.JSX.Element {
  return (
    <React.Suspense fallback={<InboxPageLoader />}>
      <InboxSpamPageContent searchParams={searchParams} />
    </React.Suspense>
  );
}
