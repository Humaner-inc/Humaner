import * as React from 'react';

import { InboxMailFolderScreen } from '@/components/dashboard/inbox/inbox-mail-folder-screen';
import { InboxPageLoader } from '@/components/dashboard/inbox/inbox-page-loader';

async function InboxSentPageContent({
  searchParams
}: {
  searchParams: Promise<{ mailbox?: string; q?: string }>;
}): Promise<React.JSX.Element> {
  const { mailbox, q } = await searchParams;
  return (
    <InboxMailFolderScreen
      folder="sent"
      title="Sent"
      emptyTitle="No sent mail"
      emptyDescription="Messages you send will appear here."
      mailbox={mailbox}
      query={q}
    />
  );
}

export default function InboxSentPage({
  searchParams
}: {
  searchParams: Promise<{ mailbox?: string; q?: string }>;
}): React.JSX.Element {
  return (
    <React.Suspense fallback={<InboxPageLoader />}>
      <InboxSentPageContent searchParams={searchParams} />
    </React.Suspense>
  );
}
