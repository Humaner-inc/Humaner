import * as React from 'react';
import type { Metadata } from 'next';
import { connection } from 'next/server';

import { InboxSettingsTabs } from '@/components/dashboard/inbox/inbox-settings-tabs';
import { WorkspaceSettingsPanel } from '@/components/dashboard/settings/organization/workspace-settings-panel';
import { SectionPage } from '@/components/ui/section-shell';
import { Routes } from '@/constants/routes';
import { requireDashboardPageOrRedirect } from '@/lib/auth/require-workspace-access';
import { createDashboardPageMetadata } from '@/lib/metadata/dashboard-metadata';

export const metadata: Metadata = createDashboardPageMetadata(
  Routes.OrganizationWorkspace,
  'Workspace'
);

export default async function WorkspacePage(): Promise<React.JSX.Element> {
  await connection();
  await requireDashboardPageOrRedirect('overview');

  return (
    <SectionPage
      width="xl"
      className="flex min-h-0 flex-1 flex-col"
    >
      <InboxSettingsTabs
        active="settings"
        className="justify-center"
      />
      <WorkspaceSettingsPanel />
    </SectionPage>
  );
}
