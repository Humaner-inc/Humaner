'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SidebarBranchIcon } from '@/components/dashboard/sidebar-branch-icon';
import {
  SIDEBAR_TREE_TRIGGER_CLASS,
  SidebarBranchItem,
  SidebarBranchLabel,
  SidebarBranchNav,
  SidebarHeadTitle,
  SidebarTreeDisclosureIcon
} from '@/components/dashboard/sidebar-branch-nav';
import {
  SIDEBAR_DRAWER_IDS,
  useSidebarNavDrawer
} from '@/components/dashboard/sidebar-nav-accordion';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import {
  getActiveSettingsTab,
  isSettingsPath,
  SETTINGS_NAV_TABS
} from '@/constants/settings-nav-items';
import { isWorkspaceOwner } from '@/lib/auth/workspace-access';
import { cn } from '@/lib/utils';
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
  const { open, onOpenChange } = useSidebarNavDrawer(
    SIDEBAR_DRAWER_IDS.settings
  );

  const visibleTabs = React.useMemo(
    () => SETTINGS_NAV_TABS.filter((tab) => !tab.ownerOnly || isOwner),
    [isOwner]
  );
  const activeIndex = visibleTabs.findIndex((tab) => tab.id === activeTab);

  return (
    <SidebarGroup className="py-0">
      <SidebarMenu>
        <Collapsible
          open={open}
          onOpenChange={onOpenChange}
        >
          <SidebarMenuItem className="relative">
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                variant="section"
                tooltip="Settings"
                isActive={inSettings}
                className={cn('group/settings', SIDEBAR_TREE_TRIGGER_CLASS)}
              >
                <SidebarTreeDisclosureIcon open={open} />
                <SidebarHeadTitle shortLabel="SET">Settings</SidebarHeadTitle>
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent className="group-data-[collapsible=icon]:overflow-visible">
              <SidebarBranchNav activeIndex={inSettings ? activeIndex : -1}>
                {visibleTabs.map((tab) => {
                  const isActive = activeTab === tab.id;

                  return (
                    <SidebarBranchItem
                      key={tab.id}
                      asChild
                      isActive={isActive}
                      tooltip={tab.label}
                    >
                      <Link href={tab.href}>
                        <SidebarBranchIcon icon={tab.icon} />
                        <SidebarBranchLabel isActive={isActive}>
                          {tab.label}
                        </SidebarBranchLabel>
                      </Link>
                    </SidebarBranchItem>
                  );
                })}
              </SidebarBranchNav>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
}
