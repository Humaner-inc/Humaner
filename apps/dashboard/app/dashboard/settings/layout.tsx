import * as React from 'react';
import type { Metadata } from 'next';

import { SettingsDock } from '@/components/dashboard/settings/settings-dock';
import { DockSection } from '@/components/ui/section-shell';
import { getProfile } from '@/data/account/get-profile';
import { createTitle } from '@/lib/utils';

export const metadata: Metadata = {
  title: createTitle('Settings')
};

export default async function SettingsLayout({
  children
}: React.PropsWithChildren): Promise<React.JSX.Element> {
  const profile = await getProfile();

  return (
    <DockSection dock={<SettingsDock profile={profile} />}>{children}</DockSection>
  );
}
