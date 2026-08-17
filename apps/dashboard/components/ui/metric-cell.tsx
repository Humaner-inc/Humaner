import * as React from 'react';

import { MicroLabel } from '@/components/ui/micro-label';
import { cn } from '@/lib/utils';

export type MetricCellProps = React.HTMLAttributes<HTMLDivElement> & {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: string;
};

/** Metric value with its label beside it — not stacked or centered above. */
export function MetricCell({
  label,
  value,
  hint,
  className,
  ...props
}: MetricCellProps): React.JSX.Element {
  return (
    <div
      className={cn('flex h-11 items-center gap-2 px-3', className)}
      {...props}
    >
      <p className="w-[2ch] shrink-0 font-mono text-xl tabular-nums leading-none tracking-tight">
        {value}
      </p>
      <div className="flex min-w-0 items-center">
        {typeof label === 'string' ? <MicroLabel>{label}</MicroLabel> : label}
        {hint ? (
          <p className="ml-1.5 truncate font-info text-[10px] leading-none text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export type MetricRowProps = React.HTMLAttributes<HTMLDivElement>;

export function MetricRow({
  className,
  children,
  ...props
}: MetricRowProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'grid divide-x divide-border/50 border-b border-border/50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
