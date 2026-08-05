import * as React from 'react';

import { SectionPage } from '@/components/ui/section-shell';

/** Escalation-baseline margins. */
export default function InboxTagsLayout({
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
