import * as React from 'react';

import { SectionPage } from '@/components/ui/section-shell';

/** Full-bleed triage inbox (Human Desk–style). */
export default function InboxAllLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <SectionPage
      width="full"
      className="flex min-h-0 flex-1 flex-col"
    >
      {children}
    </SectionPage>
  );
}
