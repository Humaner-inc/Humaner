import * as React from 'react';

import { Skeleton } from '@/components/ui/skeleton';

export function McpRequestLogsSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-2.5">
      {['a', 'b', 'c'].map((row) => (
        <div
          key={row}
          className="flex items-center gap-3 py-1"
        >
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="ml-auto h-4 w-12" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
