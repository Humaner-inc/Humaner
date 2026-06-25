'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Role } from '@prisma/client';

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  type SidebarGroupProps
} from '@/components/ui/sidebar';
import { mainNavItems } from '@/constants/nav-items';
import { cn } from '@/lib/utils';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export type NavMainProps = SidebarGroupProps & {
  profile: ProfileDto;
};

export function NavMain({ profile, ...props }: NavMainProps): React.JSX.Element {
  const pathname = usePathname();
  const isAdmin = profile.role === Role.ADMIN;
  const items = mainNavItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <SidebarGroup {...props}>
      <SidebarMenu>
        {items.map((item, index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.href)}
              tooltip={item.title}
            >
              <Link
                href={item.disabled ? '#' : item.href}
                target={item.external ? '_blank' : undefined}
              >
                <item.icon
                  className={cn(
                    'size-4 shrink-0',
                    pathname.startsWith(item.href)
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                />
                <span
                  className={
                    pathname.startsWith(item.href)
                      ? 'dark:text-foreground'
                      : 'dark:text-muted-foreground'
                  }
                >
                  {item.title}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
