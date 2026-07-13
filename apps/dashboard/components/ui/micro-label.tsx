import * as React from 'react';

import { cn } from '@/lib/utils';

export type MicroLabelProps = React.HTMLAttributes<HTMLSpanElement>;

/** Mono uppercase micro-label for section tags, status text, and metadata. */
export function MicroLabel({
  className,
  children,
  ...props
}: MicroLabelProps): React.JSX.Element {
  return (
    <span
      className={cn('micro-label', className)}
      {...props}
    >
      {children}
    </span>
  );
}

export type StatusTagProps = React.HTMLAttributes<HTMLSpanElement> & {
  active?: boolean;
};

/** Minimal status indicator — border + tint, no filled pill. */
export function StatusTag({
  active = false,
  className,
  children,
  ...props
}: StatusTagProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider',
        active
          ? 'border-[color-mix(in_srgb,var(--accent-color,#e1ccaf)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent-color,#e1ccaf)_12%,transparent)] text-foreground'
          : 'border-border/60 bg-muted/30 text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
