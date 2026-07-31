'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import {
  NavAgentTree,
  type SidebarAgent
} from '@/components/dashboard/nav-agent-tree';
import { NavDeskTree } from '@/components/dashboard/nav-desk-tree';
import { NavInboxTree } from '@/components/dashboard/nav-inbox-tree';
import { NavIntegrationsTree } from '@/components/dashboard/nav-integrations-tree';
import { NavOrganizationTree } from '@/components/dashboard/nav-organization-tree';
import { NavSettingsTree } from '@/components/dashboard/nav-settings-tree';
import { SidebarMainNavHighlight } from '@/components/dashboard/sidebar-main-nav-highlight';
import { SidebarNavAccordionProvider } from '@/components/dashboard/sidebar-nav-accordion';
import { SidebarNavLink } from '@/components/dashboard/sidebar-nav-tree';
import {
  SidebarGroup,
  SidebarSeparator,
  type SidebarGroupProps
} from '@/components/ui/sidebar';
import { adminNavItems, mainNavItems } from '@/constants/nav-items';
import { Routes } from '@/constants/routes';
import {
  canAccessPage,
  filterNavItemsForProfile,
  isPlatformAdmin
} from '@/lib/auth/workspace-access';
import { isOssDeployment } from '@/lib/deployment-mode';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export type NavMainProps = SidebarGroupProps & {
  profile: ProfileDto;
  agents: SidebarAgent[];
  orgTier: string;
  inboxUnreadCount?: number;
  handoffOpenCount?: number;
};

export function NavMain({
  profile,
  agents,
  orgTier,
  inboxUnreadCount = 0,
  handoffOpenCount = 0,
  ...props
}: NavMainProps): React.JSX.Element {
  const pathname = usePathname();
  const items = [
    ...filterNavItemsForProfile(mainNavItems, profile),
    ...(isPlatformAdmin(profile)
      ? filterNavItemsForProfile(adminNavItems, profile)
      : [])
  ];

  return (
    <SidebarNavAccordionProvider agents={agents}>
      <SidebarMainNavHighlight className="flex flex-col gap-0 px-1 pt-1">
        <NavOrganizationTree />
        {canAccessPage(profile, 'integrations') ? (
          <NavIntegrationsTree orgTier={orgTier} />
        ) : null}
        {!isOssDeployment() && canAccessPage(profile, 'inbox') ? (
          <NavInboxTree
            orgTier={orgTier}
            unreadCount={inboxUnreadCount}
          />
        ) : null}
        {canAccessPage(profile, 'desk') ? (
          <NavDeskTree
            orgTier={orgTier}
            handoffOpenCount={handoffOpenCount}
          />
        ) : null}
        <NavSettingsTree profile={profile} />
        {items.length > 0 ? (
          <SidebarGroup
            {...props}
            className="py-0"
          >
            <div className="space-y-0.5">
              {items.map((item) => (
                <SidebarNavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.title}
                  active={
                    item.href === Routes.Home
                      ? pathname === Routes.Home
                      : pathname.startsWith(item.href)
                  }
                  external={item.external}
                  disabled={item.disabled}
                  mainNavHighlight
                />
              ))}
            </div>
          </SidebarGroup>
        ) : null}
      </SidebarMainNavHighlight>
      <div className="px-1">
        {agents.length > 0 ? (
          <>
            <SidebarSeparator className="my-1.5 opacity-50" />
            <NavAgentTree agents={agents} />
          </>
        ) : null}
      </div>
    </SidebarNavAccordionProvider>
  );
}
