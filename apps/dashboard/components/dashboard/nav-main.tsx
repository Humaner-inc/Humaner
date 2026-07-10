'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  NavAgentTree,
  type SidebarAgent
} from '@/components/dashboard/nav-agent-tree';
import { NavDeskTree } from '@/components/dashboard/nav-desk-tree';
import { NavIntegrationsTree } from '@/components/dashboard/nav-integrations-tree';
import { NavOrganizationTree } from '@/components/dashboard/nav-organization-tree';
import { NavSettingsTree } from '@/components/dashboard/nav-settings-tree';
import { SidebarNavAccordionProvider } from '@/components/dashboard/sidebar-nav-accordion';
import {
  NavMenuIcon,
  useNavMenuIconAnimation
} from '@/components/ui/nav-menu-icon';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
import { cn } from '@/lib/utils';
import type { ProfileDto } from '@/types/dtos/profile-dto';
import type { NavItem } from '@/types/nav-item';

export type NavMainProps = SidebarGroupProps & {
  profile: ProfileDto;
  agents: SidebarAgent[];
  orgTier: string;
};

function NavMainItem({
  item,
  isActive
}: {
  item: NavItem;
  isActive: boolean;
}): React.JSX.Element {
  const { iconRef, menuHoverHandlers } = useNavMenuIconAnimation();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.title}
      >
        <Link
          href={item.disabled ? '#' : item.href}
          target={item.external ? '_blank' : undefined}
          {...menuHoverHandlers}
        >
          <NavMenuIcon
            icon={item.icon}
            iconRef={iconRef}
            className={cn(
              'size-4 shrink-0',
              isActive ? 'text-inherit' : 'text-muted-foreground'
            )}
          />
          <span className={isActive ? 'text-inherit' : 'text-muted-foreground'}>
            {item.title}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function NavMain({
  profile,
  agents,
  orgTier,
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
      <NavOrganizationTree />
      {canAccessPage(profile, 'integrations') ? (
        <NavIntegrationsTree orgTier={orgTier} />
      ) : null}
      {canAccessPage(profile, 'desk') ? (
        <NavDeskTree orgTier={orgTier} />
      ) : null}
      <NavSettingsTree profile={profile} />
      {items.length > 0 ? (
        <SidebarGroup {...props}>
          <SidebarMenu>
            {items.map((item) => (
              <NavMainItem
                key={item.href}
                item={item}
                isActive={
                  item.href === Routes.Home
                    ? pathname === Routes.Home
                    : pathname.startsWith(item.href)
                }
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ) : null}
      <SidebarSeparator className="my-2" />
      <NavAgentTree agents={agents} />
    </SidebarNavAccordionProvider>
  );
}
