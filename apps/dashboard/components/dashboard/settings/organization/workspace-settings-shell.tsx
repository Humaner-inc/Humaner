import * as React from 'react';

/**
 * Self-Host twin. Inbox / Companion / Connect stay Cloud-only; josh renames
 * this onto `workspace-settings-shell.tsx` so Data still renders.
 */
export async function WorkspaceSettingsShell({
  children
}: {
  tab?: string;
  apps?: string;
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  return <>{children}</>;
}
