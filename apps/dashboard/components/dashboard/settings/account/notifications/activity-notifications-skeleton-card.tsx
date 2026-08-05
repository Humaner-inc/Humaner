import * as React from 'react';

import {
  Card,
  CardContent,
  CardFooter,
  type CardProps
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export function ActivityNotificationsSkeletonCard(
  props: CardProps
): React.JSX.Element {
  return (
    <Card {...props}>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, section) => (
            <div
              key={section}
              className="space-y-4"
            >
              <div className="space-y-0.5">
                <Skeleton className="h-[17px] w-[100px]" />
                <Skeleton className="h-[19px] w-[240px]" />
              </div>
              {Array.from({ length: 2 }).map((__, row) => (
                <div
                  key={row}
                  className="flex flex-row items-center justify-between"
                >
                  <div className="flex flex-col space-y-0.5">
                    <Skeleton className="h-[17px] w-[90px]" />
                    <Skeleton className="h-[19px] w-[200px]" />
                  </div>
                  <Skeleton className="h-5 w-9 rounded-full" />
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-14 rounded-md" />
              </div>
              {section === 0 ? <Separator /> : null}
            </div>
          ))}
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="flex w-full justify-end pt-6">
        <Skeleton className="h-9 w-16" />
      </CardFooter>
    </Card>
  );
}
