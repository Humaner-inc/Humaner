import * as React from 'react';

import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

/** Static chrome only — never render `{children}` here. Cache Components
 * prerenders Suspense fallbacks; pages that call `auth()` would hit
 * `crypto.getRandomValues()` during that pass. */
export function DashboardChromeFallback(): React.JSX.Element {
  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-shell text-foreground"
      data-dashboard-shell="pending"
    >
      <div className="flex h-12 shrink-0 items-center gap-1.5 px-2">
        <div className="hidden h-8 w-[15rem] shrink-0 md:block" />
        <div className="hidden min-w-0 flex-1 gap-1.5 md:flex">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="h-8 flex-1 rounded-sm bg-sidebar"
            />
          ))}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 gap-2 px-2 pb-2 max-md:p-0">
        <div
          className={cn(
            'hidden w-[15rem] shrink-0 bg-sidebar md:block',
            dashboardRadiusClassName
          )}
        />
        <div
          className={cn(
            'flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden bg-background p-6 ring-1 ring-border/60 max-md:rounded-none',
            dashboardRadiusClassName
          )}
        >
          <div className="h-8 w-48 animate-pulse rounded-md bg-muted/40" />
          <div className="h-32 animate-pulse rounded-md bg-muted/40" />
          <div className="h-32 animate-pulse rounded-md bg-muted/40" />
        </div>
      </div>
    </div>
  );
}
