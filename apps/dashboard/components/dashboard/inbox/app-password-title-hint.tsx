'use client';

import * as React from 'react';
import { TriangleAlertIcon } from '@humaner/shared/icons';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function AppPasswordTitleHint({
  className
}: {
  className?: string;
}): React.JSX.Element {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Works with an in-app password"
          className={cn(
            'inline-flex size-4 items-center justify-center text-warning',
            className
          )}
        >
          <TriangleAlertIcon className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Works with an in-app password</TooltipContent>
    </Tooltip>
  );
}
