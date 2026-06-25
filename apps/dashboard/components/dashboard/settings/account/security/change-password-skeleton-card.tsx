import * as React from 'react';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export function ChangePasswordSkeletonCard(): React.JSX.Element {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="mb-2 flex flex-col space-y-2">
            <Skeleton className="h-3.5 w-[200px]" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="mb-2 flex flex-col space-y-2">
            <Skeleton className="h-3.5 w-[200px]" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-1 px-4 py-2">
            <Skeleton className="h-5 w-[292px]" />
            <Skeleton className="h-5 w-[224px]" />
            <Skeleton className="h-5 w-[224px]" />
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
