import * as React from 'react';

import {
  Card,
  CardContent,
  CardFooter,
  type CardProps
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export function ApiKeysSkeletonCard(props: CardProps): React.JSX.Element {
  return (
    <Card {...props}>
      <CardContent className="p-0">
        <div className="flex h-[88px] flex-row justify-between p-6">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-5 w-[200px]" />
            <Skeleton className="h-4 w-[120px]" />
          </div>
          <Skeleton className="size-8" />
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="flex w-full justify-end pt-6">
        <Skeleton className="h-9 w-16" />
      </CardFooter>
    </Card>
  );
}
