import { dangerZonePanelClassName } from '@/components/ui/danger-zone';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function DangerZoneSkeletonCard(): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between',
        dangerZonePanelClassName
      )}
    >
      <div className="min-w-0 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <Skeleton className="h-9 w-[132px] shrink-0" />
    </div>
  );
}
