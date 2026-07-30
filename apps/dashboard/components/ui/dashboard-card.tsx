import * as React from 'react';

import { dashboardSurfaceClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

export type DashboardCardProps = React.HTMLAttributes<HTMLElement>;

/** Minimal bordered card shell — sharp corners, no shadow. */
export function DashboardCard({
  className,
  children,
  ...props
}: DashboardCardProps): React.JSX.Element {
  return (
    <section
      className={cn(dashboardSurfaceClassName, className)}
      {...props}
    >
      {children}
    </section>
  );
}

export type DashboardCardHeaderProps = React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  count?: React.ReactNode;
  action?: React.ReactNode;
};

export function DashboardCardHeader({
  title,
  count,
  action,
  className,
  ...props
}: DashboardCardHeaderProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3',
        className
      )}
      {...props}
    >
      <h2 className="section-title">
        {title}
        {count !== undefined ? (
          <span className="ml-2 font-mono text-xs tabular-nums text-muted-foreground">
            {count}
          </span>
        ) : null}
      </h2>
      {action}
    </div>
  );
}

export type DashboardCardLinkActionProps =
  React.AnchorHTMLAttributes<HTMLAnchorElement>;

export function DashboardCardLinkAction({
  className,
  children,
  ...props
}: DashboardCardLinkActionProps): React.JSX.Element {
  return (
    <a
      className={cn(
        'group inline-flex shrink-0 items-center gap-1 font-mono text-[10px] tracking-wider text-muted-foreground transition-colors hover:text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}

export type DashboardCardBodyProps = React.HTMLAttributes<HTMLDivElement>;

export function DashboardCardBody({
  className,
  children,
  ...props
}: DashboardCardBodyProps): React.JSX.Element {
  return (
    <div
      className={cn('p-3', className)}
      {...props}
    >
      {children}
    </div>
  );
}
