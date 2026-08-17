import * as React from 'react';

import { SettingsNavTabs } from '@/components/dashboard/settings/settings-nav-tabs';
import { SectionPage } from '@/components/ui/section-shell';
import { getProfile } from '@/data/account/get-profile';

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
