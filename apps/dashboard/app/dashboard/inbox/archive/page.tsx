import * as React from 'react';

import { InboxMailFolderScreen } from '@/components/dashboard/inbox/inbox-mail-folder-screen';
import { InboxPageLoader } from '@/components/dashboard/inbox/inbox-page-loader';

async function InboxArchivePageContent({
  searchParams
}: {
  searchParams: Promise<{ mailbox?: string; q?: string }>;
}): Promise<React.JSX.Element> {
  const { mailbox, q } = await searchParams;
  return (
    <InboxMailFolderScreen
      folder="archive"
      title="Archive"
      emptyTitle="Archive is empty"
      emptyDescription="Archived threads will appear here."
      mailbox={mailbox}
      query={q}
    />
  );
}

export default function InboxArchivePage({
  searchParams
}: {
  searchParams: Promise<{ mailbox?: string; q?: string }>;
}): React.JSX.Element {
  return (
    <React.Suspense fallback={<InboxPageLoader />}>
      <InboxArchivePageContent searchParams={searchParams} />
    </React.Suspense>
  );
}
