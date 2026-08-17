import * as React from 'react';

export function DashboardChromeFallback({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <div
      className="flex h-screen overflow-hidden bg-background text-foreground"
      data-dashboard-shell="pending"
    >
      <div className="hidden h-svh w-[15rem] shrink-0 border-r border-border/50 bg-sidebar md:block" />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="h-14 shrink-0 border-b border-border/50" />
        <div className="flex min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
