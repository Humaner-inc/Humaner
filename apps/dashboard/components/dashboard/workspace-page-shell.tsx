import * as React from 'react';

import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

/**
 * Full-bleed workspace chrome — Tasks is the reference
 * (header px-5 py-4 + border, body px-5 py-4).
 */
export function WorkspacePageShell({
  title,
  leading,
  actions,
  toolbar,
  children,
  className
}: {
  title: React.ReactNode;
  /** Shown at the top-left of the header (e.g. connected provider logos). */
  leading?: React.ReactNode;
  actions?: React.ReactNode;
  /** Optional controls under the header row (filters, create form, etc.). */
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  const hasRow = leading != null || actions != null;
  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-1 flex-col overflow-hidden',
        className
      )}
    >
      <h1 className="sr-only">{title}</h1>
      {hasRow || toolbar != null ? (
        <header className="shrink-0 border-b border-border/60 px-5 py-4">
          {hasRow ? (
            <div className="flex flex-wrap items-end justify-between gap-3">
              {leading ? (
                <div className="flex min-w-0 items-center self-center">
                  {leading}
                </div>
              ) : null}
              {actions ? (
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  {actions}
                </div>
              ) : null}
            </div>
          ) : null}
          {toolbar ? (
            <div className={hasRow ? 'mt-4' : undefined}>{toolbar}</div>
          ) : null}
        </header>
      ) : null}
      <div className="min-h-0 flex-1 overflow-auto px-5 py-4">{children}</div>
    </div>
  );
}

/** Companion-style mark next to presentation page titles (MCP, Resources). */
export function PresentationPageMark({
  children,
  className,
  style
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        dashboardRadiusClassName,
        'flex size-11 shrink-0 items-center justify-center',
        className
      )}
      style={style}
      aria-hidden
    >
      {children}
    </div>
  );
}
