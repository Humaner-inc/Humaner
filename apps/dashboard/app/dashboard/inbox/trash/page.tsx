import * as React from 'react';

import { InboxMailFolderScreen } from '@/components/dashboard/inbox/inbox-mail-folder-screen';
import { InboxPageLoader } from '@/components/dashboard/inbox/inbox-page-loader';

async function InboxTrashPageContent({
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

export default function InboxTrashPage({
  searchParams
}: {
  searchParams: Promise<{ mailbox?: string }>;
}): React.JSX.Element {
  return (
    <React.Suspense fallback={<InboxPageLoader />}>
      <InboxTrashPageContent searchParams={searchParams} />
    </React.Suspense>
  );
}
