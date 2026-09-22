import * as React from 'react';
import type { Metadata } from 'next';

import { Routes } from '@/constants/routes';
import { createDashboardPageMetadata } from '@/lib/metadata/dashboard-metadata';

import { DashboardSessionShell } from './dashboard-session-shell';
import { InboxAllPendingFallback } from './inbox-all-pending-fallback';

export const metadata: Metadata = createDashboardPageMetadata(
  Routes.Home,
  'Organization'
);

export default function DashboardLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <React.Suspense fallback={<InboxAllPendingFallback />}>
      <DashboardSessionShell>{children}</DashboardSessionShell>
    </React.Suspense>
  );
}
