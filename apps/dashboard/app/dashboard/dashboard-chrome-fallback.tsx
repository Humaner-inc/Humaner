import * as React from 'react';

/** Static chrome only — never render `{children}` here. Cache Components
 * prerenders Suspense fallbacks; pages that call `auth()` would hit
 * `crypto.getRandomValues()` during that pass. */
export function DashboardChromeFallback(): React.JSX.Element {
  return (
    <div
      className="flex h-screen overflow-hidden bg-background text-foreground"
      data-dashboard-shell="pending"
    >
      <div className="hidden h-svh w-[15rem] shrink-0 border-r border-border/50 bg-sidebar md:block" />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="h-14 shrink-0 border-b border-border/50" />
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-6">
          <div className="h-8 w-48 animate-pulse rounded-md bg-muted/40" />
          <div className="h-32 animate-pulse rounded-md bg-muted/40" />
          <div className="h-32 animate-pulse rounded-md bg-muted/40" />
        </div>
      </div>
    </div>
  );
}
