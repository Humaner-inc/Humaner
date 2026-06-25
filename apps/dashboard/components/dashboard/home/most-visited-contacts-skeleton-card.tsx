import * as React from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  type CardProps
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export type MostVisitedContactsSkeletonCardProps = CardProps;

export function MostVisitedContactsSkeletonCard(
  props: MostVisitedContactsSkeletonCardProps
): React.JSX.Element {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle className="text-base">Most visited contacts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex h-9 flex-row items-center justify-between px-3"
            >
              <Skeleton className="mr-2 size-4 shrink-0" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="ml-auto size-5 shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
