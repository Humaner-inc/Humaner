'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import {
  NavAgentTree,
  type SidebarAgent
} from '@/components/dashboard/nav-agent-tree';
import type { ConnectorNavItem } from '@/components/dashboard/nav-connectors';
import { NavDeskTree } from '@/components/dashboard/nav-desk-tree';
import { NavInboxTree } from '@/components/dashboard/nav-inbox-tree';
import { NavIntegrationsTree } from '@/components/dashboard/nav-integrations-tree';
import { NavMailbox } from '@/components/dashboard/nav-mailbox';
import { NavOrganizationTree } from '@/components/dashboard/nav-organization-tree';
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
import type { MailInboxOption } from '@/data/inbox/get-mail-threads';
import {
  canAccessPage,
  filterNavItemsForProfile,
  isPlatformAdmin,
  isWorkspaceOwner
} from '@/lib/auth/workspace-access';
import { isOssDeployment } from '@/lib/deployment-mode';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export type NavMainProps = SidebarGroupProps & {
  profile: ProfileDto;
  agents: SidebarAgent[];
  orgTier: string;
  frontierBetaEnabled?: boolean;
  inboxUnreadCount?: number;
  handoffOpenCount?: number;
  agentDeskOpenCount?: number;
  mailInboxes?: MailInboxOption[];
  connectors?: ConnectorNavItem[];
};

export function NavMain({
  profile,
  agents,
  orgTier,
  frontierBetaEnabled = true,
  inboxUnreadCount = 0,
  handoffOpenCount = 0,
  agentDeskOpenCount = 0,
  mailInboxes = [],
  connectors = [],
  ...props
}: NavMainProps): React.JSX.Element {
  const pathname = usePathname();
  const oss = isOssDeployment();
  const items = [
    ...filterNavItemsForProfile(mainNavItems, profile),
    ...(isPlatformAdmin(profile)
      ? filterNavItemsForProfile(adminNavItems, profile)
      : [])
  ];

  return (
    <SidebarNavAccordionProvider agents={agents}>
      <SidebarMainNavHighlight className="flex flex-col gap-0 px-2 pt-4">
        {oss ? <NavOrganizationTree /> : null}
        {!oss && canAccessPage(profile, 'inbox') ? (
          <React.Suspense fallback={null}>
            <NavMailbox
              orgTier={orgTier}
              unreadCount={inboxUnreadCount}
              inboxes={mailInboxes}
              showMcp={isWorkspaceOwner(profile)}
              canManageTeam={
                isWorkspaceOwner(profile) || canAccessPage(profile, 'overview')
              }
              canManageProviders={
                isWorkspaceOwner(profile) || canAccessPage(profile, 'settings')
              }
              connectors={connectors}
            />
          </React.Suspense>
        ) : null}
        {oss && canAccessPage(profile, 'inbox') ? (
          <NavInboxTree
            orgTier={orgTier}
            unreadCount={inboxUnreadCount}
          />
        ) : null}
        {oss && canAccessPage(profile, 'desk') ? (
          <NavDeskTree
            orgTier={orgTier}
            frontierBetaEnabled={frontierBetaEnabled}
            handoffOpenCount={handoffOpenCount}
            agentDeskOpenCount={agentDeskOpenCount}
          />
        ) : null}
        {oss && canAccessPage(profile, 'integrations') ? (
          <NavIntegrationsTree orgTier={orgTier} />
        ) : null}
        {items.length > 0 ? (
          <SidebarGroup
            {...props}
            className="p-0"
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
      <div className="px-2">
        {oss && agents.length > 0 ? (
          <>
            <SidebarSeparator className="my-1.5 opacity-50" />
            <NavAgentTree
              agents={agents}
              orgTier={orgTier}
              frontierBetaEnabled={frontierBetaEnabled}
            />
          </>
        ) : null}
      </div>
    </SidebarNavAccordionProvider>
  );
}
