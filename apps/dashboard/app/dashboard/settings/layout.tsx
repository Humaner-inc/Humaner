import * as React from 'react';
import type { Metadata } from 'next';

import { SettingsDock } from '@/components/dashboard/settings/settings-dock';
import { DockSection } from '@/components/ui/section-shell';
import { createTitle } from '@/lib/utils';

export const metadata: Metadata = {
  title: createTitle('Settings')
};

export default function SettingsLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <DockSection dock={<SettingsDock />}>{children}</DockSection>
  );
}
