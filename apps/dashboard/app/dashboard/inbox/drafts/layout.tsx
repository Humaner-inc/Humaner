import * as React from 'react';

import { SectionPage } from '@/components/ui/section-shell';

export default function InboxDraftsLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <SectionPage
      width="full"
      overflow="hidden"
      className="flex h-full min-h-0 flex-1 flex-col p-0 md:p-0"
    >
      {children}
    </SectionPage>
  );
}
