import * as React from 'react';
import type { Metadata } from 'next';

import { SectionPage } from '@/components/ui/section-shell';
import { Routes } from '@/constants/routes';
import { createDashboardPageMetadata } from '@/lib/metadata/dashboard-metadata';

export const metadata: Metadata = createDashboardPageMetadata(Routes.Tasks);

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
