'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const statusPillVariants = cva(
  'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full text-xs font-medium',
  {
    variants: {
      variant: {
        pending:
          'border-0 bg-orange-500/15 px-2.5 text-orange-700 hover:bg-orange-500/15 dark:text-orange-300',
        success:
          'border border-emerald-500/30 bg-emerald-500/10 px-2.5 text-emerald-700 dark:text-emerald-300',
        failed:
          'border border-destructive/25 bg-destructive/10 px-2.5 text-destructive'
      },
      iconOnly: {
        true: 'w-8 px-0',
        false: 'px-2.5'
      }
    },
    defaultVariants: {
      variant: 'pending',
      iconOnly: false
    }
  }
);

export type StatusPillProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof statusPillVariants>;

export function StatusPill({
  className,
  variant,
  iconOnly,
  ...props
}: StatusPillProps): React.JSX.Element {
  return (
    <span
      className={cn(statusPillVariants({ variant, iconOnly }), className)}
      {...props}
    />
  );
}

export function ListRowActions({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn('flex shrink-0 items-center gap-2', className)}
      {...props}
    />
  );
}
