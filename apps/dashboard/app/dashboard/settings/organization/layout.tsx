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
    <React.Suspense fallback={children}>
      <RequireWorkspaceOwner>{children}</RequireWorkspaceOwner>
    </React.Suspense>
  );
}
