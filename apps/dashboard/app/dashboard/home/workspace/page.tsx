import * as React from 'react';
import type { Metadata } from 'next';
import { connection } from 'next/server';

import { WorkspaceSettingsPanel } from '@/components/dashboard/settings/organization/workspace-settings-panel';
import { WorkspaceSettingsShell } from '@/components/dashboard/settings/organization/workspace-settings-shell';
import { SectionPage } from '@/components/ui/section-shell';
import { Routes } from '@/constants/routes';
import { requireAnyDashboardPageOrRedirect } from '@/lib/auth/require-workspace-access';
import { createDashboardPageMetadata } from '@/lib/metadata/dashboard-metadata';

export const metadata: Metadata = createDashboardPageMetadata(
  Routes.OrganizationWorkspace,
  'Settings'
);

export default async function WorkspacePage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string; apps?: string }>;
}): Promise<React.JSX.Element> {
  await connection();
  await requireAnyDashboardPageOrRedirect(['overview', 'inbox']);
  const params = await searchParams;

  return (
    <SectionPage
      width="xl"
      className="flex min-h-0 flex-1 flex-col"
    >
      <WorkspaceSettingsShell
        tab={params.tab}
        apps={params.apps}
      >
        <WorkspaceSettingsPanel />
      </WorkspaceSettingsShell>
    </SectionPage>
  );
}
