import { headers } from 'next/headers';

import { InboxAllSkeletonGuard } from '@/components/dashboard/inbox/inbox-all-skeleton-guard';
import { InboxPageLoader } from '@/components/dashboard/inbox/inbox-page-loader';
import { isInboxAllPath } from '@/lib/inbox/is-inbox-all-path';

export default async function DashboardLoading(): Promise<React.JSX.Element> {
  const pathname = (await headers()).get('x-pathname');
  if (isInboxAllPath(pathname)) {
    return <InboxPageLoader />;
  }

  return (
    <InboxAllSkeletonGuard>
      <div
        className="flex h-full flex-1 flex-col gap-4 p-6"
        data-dashboard-page-shell="loading"
      >
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted/40" />
        <div className="h-32 animate-pulse rounded-md bg-muted/40" />
        <div className="h-32 animate-pulse rounded-md bg-muted/40" />
      </div>
    </InboxAllSkeletonGuard>
  );
}
