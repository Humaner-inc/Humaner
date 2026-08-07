import * as React from 'react';

import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

export const dangerZoneTitleClassName =
  'font-mono text-xs font-medium uppercase tracking-[0.08em] text-destructive dark:text-red-400';

export const dangerZonePanelClassName = cn(
  'border border-destructive/35 bg-destructive/5 dark:border-red-500/40 dark:bg-red-500/10',
  dashboardRadiusClassName
);

export type DangerZoneProps = React.HTMLAttributes<HTMLElement> & {
  title?: string;
};

export function DangerZone({
  title = 'Danger zone',
  className,
  children,
  ...props
}: DangerZoneProps): React.JSX.Element {
  return (
    <section
      className={cn('space-y-3', className)}
      {...props}
    >
      <h2 className={dangerZoneTitleClassName}>{title}</h2>
      {children}
    </section>
  );
}

export type DangerZonePanelProps = React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  description: React.ReactNode;
  action: React.ReactNode;
};

export function DangerZonePanel({
  title,
  description,
  action,
  className,
  ...props
}: DangerZonePanelProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between',
        dangerZonePanelClassName,
        className
      )}
      {...props}
    >
      <div className="min-w-0">
        <p className="subsection-title text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
