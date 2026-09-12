'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { SettingsTabBar } from '@/components/dashboard/settings/settings-tab-bar';
import { Routes } from '@/constants/routes';
import {
  ACCOUNT_SETTINGS_NAV_TABS,
  getActiveSettingsTab,
  isWorkspaceSettingsPath,
  WORKSPACE_SETTINGS_NAV_TABS
} from '@/constants/settings-nav-items';
import { isWorkspaceOwner } from '@/lib/auth/workspace-access';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export type SettingsNavTabsProps = {
  profile: ProfileDto;
  className?: string;
};

export function SettingsNavTabs({
  profile,
  className
}: SettingsNavTabsProps): React.JSX.Element {
  const pathname = usePathname();
  if (pathname.startsWith(Routes.Developers)) {
    return <></>;
  }
  const activeTab = getActiveSettingsTab(pathname);
  const isOwner = isWorkspaceOwner(profile);
  const isWorkspaceSettings = isWorkspaceSettingsPath(pathname);
  const tabs = (
    isWorkspaceSettings
      ? WORKSPACE_SETTINGS_NAV_TABS
      : ACCOUNT_SETTINGS_NAV_TABS
  ).filter((tab) => !tab.ownerOnly || isOwner);

  return (
    <SettingsTabBar
      ariaLabel={
        isWorkspaceSettings ? 'Workspace settings' : 'Account settings'
      }
      className={className}
      tabs={tabs.map((tab) => ({
        id: tab.id,
        href: tab.href,
        label: tab.label,
        icon: tab.icon,
        active: activeTab === tab.id
      }))}
    />
  );
}
