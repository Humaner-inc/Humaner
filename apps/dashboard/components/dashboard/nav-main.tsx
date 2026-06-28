'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  type SidebarGroupProps
} from '@/components/ui/sidebar';
import {
  NavMenuIcon,
  useNavMenuIconAnimation
} from '@/components/ui/nav-menu-icon';
import { mainNavItems } from '@/constants/nav-items';
import { filterNavItemsForProfile } from '@/lib/auth/workspace-access';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types/nav-item';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export type NavMainProps = SidebarGroupProps & {
  profile: ProfileDto;
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

export function NavMain({ profile, ...props }: NavMainProps): React.JSX.Element {
  const pathname = usePathname();
  const items = filterNavItemsForProfile(mainNavItems, profile);

  return (
    <SidebarGroup {...props}>
      <SidebarMenu>
        {items.map((item) => (
          <NavMainItem
            key={item.href}
            item={item}
            isActive={pathname.startsWith(item.href)}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
