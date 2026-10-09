import * as React from 'react';

import { InboxMailFolderScreen } from '@/components/dashboard/inbox/inbox-mail-folder-screen';

export default async function InboxArchivePage({
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
