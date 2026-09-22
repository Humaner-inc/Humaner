import * as React from 'react';
import { headers } from 'next/headers';

import { InboxAllSkeletonGuard } from '@/components/dashboard/inbox/inbox-all-skeleton-guard';
import { InboxPageLoader } from '@/components/dashboard/inbox/inbox-page-loader';
import { isInboxAllPath } from '@/lib/inbox/is-inbox-all-path';

import { DashboardChromeFallback } from './dashboard-chrome-fallback';

/** Request-time pending UI so /inbox/all never paints the pulse skeleton. */
export async function InboxAllPendingFallback(): Promise<React.JSX.Element> {
  const pathname = (await headers()).get('x-pathname');
  if (isInboxAllPath(pathname)) {
    return <InboxPageLoader fill="screen" />;
  }
  return (
    <InboxAllSkeletonGuard fill="screen">
      <DashboardChromeFallback />
    </InboxAllSkeletonGuard>
  );
}
