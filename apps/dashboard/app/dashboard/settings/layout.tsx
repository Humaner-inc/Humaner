import * as React from 'react';
import type { Metadata } from 'next';

import { SettingsNavTabs } from '@/components/dashboard/settings/settings-nav-tabs';
import { SectionPage } from '@/components/ui/section-shell';
import { Routes } from '@/constants/routes';
import { getProfile } from '@/data/account/get-profile';
import { createDashboardPageMetadata } from '@/lib/metadata/dashboard-metadata';

export const metadata: Metadata = createDashboardPageMetadata(Routes.Settings);

async function SettingsNav(): Promise<React.JSX.Element> {
  const profile = await getProfile();
  return <SettingsNavTabs profile={profile} />;
}

export default function SettingsLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <SectionPage width="xl">
      <React.Suspense
        fallback={
          <div
            className="h-10"
            aria-hidden
          />
        }
      >
        <SettingsNav />
      </React.Suspense>
      {children}
    </SectionPage>
  );
}
