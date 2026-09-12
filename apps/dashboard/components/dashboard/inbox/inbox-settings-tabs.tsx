'use client';

import * as React from 'react';
import { BotIcon, MailIcon, PlugIcon } from '@humaner/shared/icons';

import { SettingsTabBar } from '@/components/dashboard/settings/settings-tab-bar';
import { Routes } from '@/constants/routes';

export type WorkspaceSettingsTab = 'connect' | 'inbox' | 'companion';

const TABS: Array<{
  id: WorkspaceSettingsTab;
  label: string;
  href: string;
  icon: typeof PlugIcon;
}> = [
  {
    id: 'connect',
    label: 'Connect',
    href: Routes.InboxSettings,
    icon: PlugIcon
  },
  {
    id: 'inbox',
    label: 'Inbox',
    href: `${Routes.InboxSettings}?tab=inbox`,
    icon: MailIcon
  },
  {
    id: 'companion',
    label: 'Companion',
    href: `${Routes.InboxSettings}?tab=companion`,
    icon: BotIcon
  }
];

export function InboxSettingsTabs({
  active
}: {
  active: WorkspaceSettingsTab;
}): React.JSX.Element {
  return (
    <SettingsTabBar
      ariaLabel="Workspace settings"
      tabs={TABS.map((tab) => ({
        ...tab,
        active: active === tab.id
      }))}
    />
  );
}
