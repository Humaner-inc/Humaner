import * as React from 'react';

import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

/**
 * Full-bleed workspace chrome — Tasks is the reference
 * (header px-5 py-4 + border, body px-5 py-4).
 */
export function WorkspacePageShell({
  title,
  description,
  actions,
  toolbar,
  children,
  className
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Optional controls under the title row (filters, create form, etc.). */
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-1 flex-col overflow-hidden',
        className
      )}
    >
      <header className="shrink-0 border-b border-border/60 px-5 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="hidden min-w-0 md:block">
            <h1 className="page-title">{title}</h1>
            {description ? (
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2 md:ml-auto">
              {actions}
            </div>
          ) : null}
        </div>
        {toolbar ? <div className="mt-4">{toolbar}</div> : null}
      </header>
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
