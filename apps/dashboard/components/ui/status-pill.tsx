'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const statusPillVariants = cva(
  'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-none text-xs font-medium',
  {
    variants: {
      variant: {
        pending:
          'border-0 bg-warning/15 px-2.5 text-warning hover:bg-warning/15',
        success: 'border border-success/30 bg-success/10 px-2.5 text-success',
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
