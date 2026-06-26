import * as React from 'react';

import { requireWorkspaceOwnerSession } from '@/lib/auth/require-workspace-access';

export default async function OrganizationSettingsLayout({
  children
}: React.PropsWithChildren): Promise<React.JSX.Element> {
  await requireWorkspaceOwnerSession();
  return <>{children}</>;
}
