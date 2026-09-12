import * as React from 'react';

import { SectionPage } from '@/components/ui/section-shell';

/** Full-bleed workspace board — matches Calendar / Assigned chrome. */
export default function TasksLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <SectionPage
      width="full"
      className="flex min-h-0 flex-1 flex-col p-0 md:p-0"
    >
      {children}
    </SectionPage>
  );
}
