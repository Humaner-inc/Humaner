import * as React from 'react';

import {
  Card,
  CardContent,
  CardFooter,
  type CardProps
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export function PersonalDetailsSkeletonCard(
  props: CardProps
): React.JSX.Element {
  return (
    <Card {...props}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-center pb-6">
          <Skeleton className="size-[120px] rounded-full p-0.5" />
        </div>
        <div className="grid gap-x-8 gap-y-4">
          <div className="mb-2 flex flex-col space-y-2">
            <Skeleton className="h-3.5 w-[200px]" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="mb-2 flex flex-col space-y-2">
            <Skeleton className="h-3.5 w-[200px]" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="mb-2 flex flex-col space-y-2">
            <Skeleton className="h-3.5 w-[200px]" />
            <Skeleton className="h-9 w-full" />
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
