import * as React from 'react';
import type { Metadata } from 'next';

import { SettingsDock } from '@/components/dashboard/settings/settings-dock';
import { createTitle } from '@/lib/utils';

export const metadata: Metadata = {
  title: createTitle('Settings')
};

export default function SettingsLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <SettingsDock />
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
