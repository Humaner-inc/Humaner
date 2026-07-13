'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { SettingsIcon } from '@humaner/shared/icons';

import { SIDEBAR_DRAWER_IDS } from '@/components/dashboard/sidebar-nav-accordion';
import {
  SidebarNavChild,
  SidebarNavTree
} from '@/components/dashboard/sidebar-nav-tree';
import { SidebarGroup } from '@/components/ui/sidebar';
import { Routes } from '@/constants/routes';
import {
  getActiveSettingsTab,
  isSettingsPath,
  SETTINGS_NAV_TABS
} from '@/constants/settings-nav-items';
import { isWorkspaceOwner } from '@/lib/auth/workspace-access';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export type NavSettingsTreeProps = {
  profile: ProfileDto;
};

export function NavSettingsTree({
  profile
}: NavSettingsTreeProps): React.JSX.Element {
  const pathname = usePathname();
  const activeTab = getActiveSettingsTab(pathname);
  const inSettings = isSettingsPath(pathname);
  const isOwner = isWorkspaceOwner(profile);

  const visibleTabs = React.useMemo(
    () => SETTINGS_NAV_TABS.filter((tab) => !tab.ownerOnly || isOwner),
    [isOwner]
  );

  return (
    <SidebarGroup className="py-0">
      <SidebarNavTree
        drawerId={SIDEBAR_DRAWER_IDS.settings}
        icon={SettingsIcon}
        label="Settings"
        active={inSettings}
        parentHref={Routes.Profile}
        mainNavHighlight
      >
        {visibleTabs.map((tab) => (
          <SidebarNavChild
            key={tab.id}
            href={tab.href}
            label={tab.label}
            active={activeTab === tab.id}
          />
        ))}
      </SidebarNavTree>
    </SidebarGroup>
  );
}
