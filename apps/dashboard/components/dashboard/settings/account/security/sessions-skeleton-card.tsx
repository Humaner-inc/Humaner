import * as React from 'react';

import { Card, CardContent, type CardProps } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export function SessionsSkeletonCard(props: CardProps): React.JSX.Element {
  return (
    <Card {...props}>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row items-center gap-4">
              <Skeleton className="size-6 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-[80px]" />
              </div>
            </div>
            <Skeleton className="h-9 w-[96px]" />
          </div>
          <Separator />
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row items-center gap-4">
              <Skeleton className="size-6 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-[80px]" />
              </div>
            </div>
            <Skeleton className="h-9 w-[96px]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
