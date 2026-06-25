import * as React from 'react';

import {
  Card,
  CardContent,
  CardFooter,
  type CardProps
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export function PreferencesSkeletonCard(props: CardProps): React.JSX.Element {
  return (
    <Card {...props}>
      <CardContent className="pt-6">
        <div className="space-y-8">
          <div className="mb-2 flex flex-col space-y-2">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-[19px] w-[330px]" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="mb-2 flex flex-col space-y-2">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-[19px] w-[330px]" />
            <div className="flex flex-row flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="mb-2"
                >
                  <Skeleton className="flex w-[120px] overflow-hidden rounded-lg" />
                  <div className="flex w-full justify-center p-2 pb-0">
                    <Skeleton className="w-10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="flex w-full justify-end pt-6">
        <Skeleton className="h-9 w-16" />
      </CardFooter>
    </Card>
  );
}
