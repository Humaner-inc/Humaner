'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDownIcon } from '@humaner/shared/icons';

import { SidebarBranchIcon } from '@/components/dashboard/sidebar-branch-icon';
import {
  SIDEBAR_HEAD_TITLE_CLASS,
  SidebarBranchItem,
  SidebarBranchLabel,
  SidebarBranchNav
} from '@/components/dashboard/sidebar-branch-nav';
import {
  SETTINGS_NAV_TABS,
  getActiveSettingsTab,
  isSettingsPath
} from '@/constants/settings-nav-items';
import { Routes } from '@/constants/routes';
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
  const [open, setOpen] = React.useState(inSettings);

  const visibleTabs = React.useMemo(
    () => SETTINGS_NAV_TABS.filter((tab) => !tab.ownerOnly || isOwner),
    [isOwner]
  );
  const activeIndex = visibleTabs.findIndex((tab) => tab.id === activeTab);

  React.useEffect(() => {
    if (inSettings) setOpen(true);
  }, [inSettings]);

  return (
    <SidebarGroup className="py-0">
      <SidebarMenu>
        <Collapsible open={open} onOpenChange={setOpen}>
          <SidebarMenuItem className="relative">
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                tooltip="Settings"
                isActive={inSettings}
                className="group/settings pr-8"
              >
                <Link
                  href={Routes.Profile}
                  className="flex min-w-0 flex-1 items-center"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className={SIDEBAR_HEAD_TITLE_CLASS}>Settings</span>
                </Link>
                <ChevronDownIcon
                  className={cn(
                    'absolute right-2 size-4 text-muted-foreground transition-transform',
                    open && 'rotate-180'
                  )}
                />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarBranchNav activeIndex={inSettings ? activeIndex : -1}>
                {visibleTabs.map((tab) => {
                  const isActive = activeTab === tab.id;

                  return (
                    <SidebarBranchItem
                      key={tab.id}
                      asChild
                      isActive={isActive}
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
