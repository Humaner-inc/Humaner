'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export type OnOffRockerProps = {
  id?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
};

export function OnOffRocker({
  id,
  checked,
  disabled = false,
  onCheckedChange,
  className
}: OnOffRockerProps): React.JSX.Element {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'inline-flex h-7 shrink-0 items-stretch overflow-hidden rounded-md border border-border/70 bg-muted/30 font-mono text-[10px] font-semibold uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      <span
        className={cn(
          'flex min-w-[2.25rem] items-center justify-center px-2 transition-colors',
          checked
            ? 'text-emerald-600 dark:text-emerald-500'
            : 'text-muted-foreground/50'
        )}
      >
        ON
      </span>
      <span
        aria-hidden
        className="w-px self-stretch bg-border/70"
      />
      <span
        className={cn(
          'flex min-w-[2.25rem] items-center justify-center px-2 transition-colors',
          !checked
            ? 'text-red-600 dark:text-red-500'
            : 'text-muted-foreground/50'
        )}
      >
        OFF
      </span>
    </button>
  );
}
