'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from 'lucide-react';

import { NavAccount } from '@/components/dashboard/settings/nav-account';
import { NavOrganization } from '@/components/dashboard/settings/nav-organization';
import { buttonVariants } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar
} from '@/components/ui/sidebar';
import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';

export function SettingsSidebar(): React.JSX.Element {
  const sidebar = useSidebar();
  return (
    <Sidebar
      collapsible={sidebar.isMobile ? 'icon' : 'none'}
      className="hidden h-screen w-60 min-w-60 max-w-60 flex-col border-r lg:flex"
    >
      <SidebarHeader>
        <div className="flex h-10 flex-row items-center gap-0.5 px-3 font-semibold">
          {sidebar.isMobile && (
            <Link
              href={Routes.Dashboard}
              className={cn(
                buttonVariants({
                  variant: 'ghost',
                  size: 'icon'
                }),
                '-ml-3 size-8'
              )}
            >
              <ChevronLeftIcon className="size-4 shrink-0" />
            </Link>
          )}
          Settings
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <ScrollArea
          verticalScrollBar
          className="h-full"
        >
          <NavAccount className="pt-0" />
          <NavOrganization />
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
