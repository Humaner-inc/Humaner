import * as React from 'react';

export type ResourcesWorkspaceTab = 'sources' | 'invoices' | 'quotes';

/**
 * Self-Host twin. Invoices and quotes are Cloud-only; josh renames this onto
 * `resources-workspace-chrome.tsx` so the shared Resources page keeps Sources.
 */
export async function ResourcesWorkspaceChrome({
  children
}: {
  children: React.ReactNode;
  tab?: ResourcesWorkspaceTab;
}): Promise<React.JSX.Element> {
  return <>{children}</>;
}
