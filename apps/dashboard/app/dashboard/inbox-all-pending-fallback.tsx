import * as React from 'react';

import { InboxAllSkeletonGuard } from '@/components/dashboard/inbox/inbox-all-skeleton-guard';

import { DashboardChromeFallback } from './dashboard-chrome-fallback';

/** Static pending UI — never await headers/auth here (Cache Components). */
export function InboxAllPendingFallback(): React.JSX.Element {
  return (
    <InboxAllSkeletonGuard fill="screen">
      <DashboardChromeFallback />
    </InboxAllSkeletonGuard>
  );
}
