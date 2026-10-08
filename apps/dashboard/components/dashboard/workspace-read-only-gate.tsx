'use client';

import * as React from 'react';

/**
 * Self-Host (OSS) twin of `workspace-read-only-gate.tsx`.
 *
 * The read-only workspace state comes from Cloud billing. Self-Host is never
 * billed, so the gate passes children through. josh renames this file onto
 * `workspace-read-only-gate.tsx`.
 */
export function WorkspaceReadOnlyGate({
  children
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <>{children}</>;
}
