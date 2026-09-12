import * as React from 'react';

import { dashboardSurfaceClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

export default function ApiKeysLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <section className={cn(dashboardSurfaceClassName, 'overflow-hidden')}>
      <div className="border-b border-border/60 px-5 py-4 sm:px-6">
        <h2 className="text-sm font-medium text-foreground">API keys</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Scoped keys for REST and MCP. Authorize with Bearer on POST /api/mcp.
        </p>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
