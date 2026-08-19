import * as React from 'react';

import { requireWorkspaceOwnerSession } from '@/lib/auth/require-workspace-access';

async function RequireWorkspaceOwner({
  children
}: React.PropsWithChildren): Promise<React.JSX.Element> {
  await requireWorkspaceOwnerSession();
  return <>{children}</>;
}

export default function OrganizationSettingsLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col gap-4 p-6">
          <div className="h-8 w-48 animate-pulse rounded-md bg-muted/40" />
          <div className="h-32 animate-pulse rounded-md bg-muted/40" />
        </div>
      }
    >
      <RequireWorkspaceOwner>{children}</RequireWorkspaceOwner>
    </React.Suspense>
  );
}
