'use client';

import * as React from 'react';
import { CompanionFigure } from '@humaner/shared/companion-icon';
import { MailIcon, PlugIcon, SettingsIcon } from '@humaner/shared/icons';

import { SettingsTabBar } from '@/components/dashboard/settings/settings-tab-bar';
import { Routes } from '@/constants/routes';

export type WorkspaceSettingsTab =
  | 'connect'
  | 'inbox'
  | 'companion'
  | 'settings';

function CompanionTabIcon({
  className
}: {
  className?: string;
}): React.JSX.Element {
  return (
    <CompanionFigure
      size={14}
      state="idle"
      tone="color"
      className={className}
    />
  );
}

const TABS: Array<{
  id: WorkspaceSettingsTab;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
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
    icon: CompanionTabIcon
  },
  {
    id: 'settings',
    label: 'Settings',
    href: Routes.OrganizationWorkspace,
    icon: SettingsIcon
  }
];

export function InboxSettingsTabs({
  active,
  className
}: {
  active: WorkspaceSettingsTab;
  className?: string;
}): React.JSX.Element {
  return (
    <SettingsTabBar
      ariaLabel="Workspace settings"
      className={className}
      tabs={TABS.map((tab) => ({
        ...tab,
        active: active === tab.id
      }))}
    />
  );
}
