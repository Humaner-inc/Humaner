import * as React from 'react';
import type { Metadata } from 'next';

import { SectionPage } from '@/components/ui/section-shell';
import { Routes } from '@/constants/routes';
import { createDashboardPageMetadata } from '@/lib/metadata/dashboard-metadata';

export const metadata: Metadata = createDashboardPageMetadata(
  Routes.InboxSettings
);

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
