import * as React from 'react';
import type { Metadata } from 'next';

import { AppInfo } from '@/constants/app-info';

import { DashboardSessionShell } from './dashboard-session-shell';
import { InboxAllPendingFallback } from './inbox-all-pending-fallback';

/** Neutral shell default — leaf routes set the real page title. */
export const metadata: Metadata = {
  title: AppInfo.APP_NAME
};

export default function DashboardLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <React.Suspense fallback={<InboxAllPendingFallback />}>
      <DashboardSessionShell>{children}</DashboardSessionShell>
    </React.Suspense>
  );
}
