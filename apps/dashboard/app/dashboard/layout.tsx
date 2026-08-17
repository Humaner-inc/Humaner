import * as React from 'react';
import type { Metadata } from 'next';

import { Routes } from '@/constants/routes';
import { createDashboardPageMetadata } from '@/lib/metadata/dashboard-metadata';

import { DashboardChromeFallback } from './dashboard-chrome-fallback';
import { DashboardSessionShell } from './dashboard-session-shell';

export const metadata: Metadata = createDashboardPageMetadata(
  Routes.Home,
  'Organization'
);

export default function DashboardLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <React.Suspense
      fallback={<DashboardChromeFallback>{children}</DashboardChromeFallback>}
    >
      <DashboardSessionShell>{children}</DashboardSessionShell>
    </React.Suspense>
  );
}
