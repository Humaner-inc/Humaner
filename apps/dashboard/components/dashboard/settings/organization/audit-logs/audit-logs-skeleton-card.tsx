import * as React from 'react';

import { Card, CardContent, type CardProps } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function AuditLogsSkeletonCard(props: CardProps): React.JSX.Element {
  return (
    <Card
      className={cn('flex h-full flex-col', props.className)}
      {...props}
    >
      <CardContent className="space-y-4 p-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="space-y-2"
          >
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-72" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
