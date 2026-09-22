import { InboxAllSkeletonGuard } from '@/components/dashboard/inbox/inbox-all-skeleton-guard';

export default function DashboardLoading(): React.JSX.Element {
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
