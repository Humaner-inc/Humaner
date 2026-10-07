'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import type { SidebarAgent } from '@/components/dashboard/nav-agent-tree';
import type { ConnectorNavItem } from '@/components/dashboard/nav-connectors';
import { NavSectionSidebar } from '@/components/dashboard/nav-sections';
import { SidebarMainNavHighlight } from '@/components/dashboard/sidebar-main-nav-highlight';
import { SidebarNavAccordionProvider } from '@/components/dashboard/sidebar-nav-accordion';
import { SidebarNavLink } from '@/components/dashboard/sidebar-nav-tree';
import { SidebarGroup, type SidebarGroupProps } from '@/components/ui/sidebar';
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
import { cn } from '@/lib/utils';
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
  inboxUnreadCount = 0,
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
      <SidebarMainNavHighlight
        className={cn(
          'flex flex-col gap-0 px-2 pt-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pt-3'
        )}
      >
        <React.Suspense fallback={null}>
          <NavSectionSidebar
            orgTier={orgTier}
            unreadCount={inboxUnreadCount}
            inboxes={mailInboxes}
            showMcp={isWorkspaceOwner(profile)}
            showCloudPreviewUtilities={!oss}
            canAccessCloudPreviewUtilities={isPlatformAdmin(profile)}
            canManageTeam={
              !oss &&
              (isWorkspaceOwner(profile) || canAccessPage(profile, 'overview'))
            }
            canManageProviders={
              isWorkspaceOwner(profile) || canAccessPage(profile, 'settings')
            }
            connectors={oss ? [] : connectors}
          />
        </React.Suspense>
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
    </SidebarNavAccordionProvider>
  );
}
