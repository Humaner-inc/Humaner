import * as React from 'react';

import { MicroLabel } from '@/components/ui/micro-label';
import { cn } from '@/lib/utils';

export type MetricCellProps = React.HTMLAttributes<HTMLDivElement> & {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: string;
};

/** Straight metric display — mono label + tabular value, no charts. */
export function MetricCell({
  label,
  value,
  hint,
  className,
  ...props
}: MetricCellProps): React.JSX.Element {
  return (
    <div
      className={cn('px-3 py-2.5', className)}
      {...props}
    >
      {typeof label === 'string' ? (
        <MicroLabel>{label}</MicroLabel>
      ) : (
        <span className="flex min-h-3.5 items-center justify-center">
          {label}
        </span>
      )}
      <p className="mt-1 font-mono text-xl tabular-nums leading-none tracking-tight">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
          {hint}
        </p>
      ) : null}
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
