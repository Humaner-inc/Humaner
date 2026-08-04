import * as React from 'react';

import { SettingsNavTabs } from '@/components/dashboard/settings/settings-nav-tabs';
import { SectionPage } from '@/components/ui/section-shell';
import { getProfile } from '@/data/account/get-profile';

export default async function SettingsLayout({
  children
}: React.PropsWithChildren): Promise<React.JSX.Element> {
  const profile = await getProfile();

  return (
    <SectionPage width="xl">
      <SettingsNavTabs profile={profile} />
      {children}
    </SectionPage>
  );
}
