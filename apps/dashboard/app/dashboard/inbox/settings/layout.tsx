import * as React from 'react';

import { SectionPage } from '@/components/ui/section-shell';

export default function InboxSettingsLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <SectionPage
      width="xl"
      className="flex min-h-0 flex-1 flex-col"
    >
      {children}
    </SectionPage>
  );
}
