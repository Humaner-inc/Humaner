'use client';

import { BrandWordmark } from '@humaner/shared/brand-wordmark';
import Image from 'next/image';
import * as React from 'react';

import { NavMain } from '@/components/dashboard/nav-main';
import { NavSupport } from '@/components/dashboard/nav-support';
import { NavUser } from '@/components/dashboard/nav-user';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar
} from '@/components/ui/sidebar';
import { MediaQueries } from '@/constants/media-queries';
import { AppInfo } from '@/constants/app-info';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export type AppSidebarProps = {
  profile: ProfileDto;
};

export function AppSidebar({ profile }: AppSidebarProps): React.JSX.Element {
  const sidebar = useSidebar();
  const xlUp = useMediaQuery(MediaQueries.XlUp, { ssr: true, fallback: true });
  const isCollapsed = !sidebar.isMobile && !sidebar.open;
  const [brandHovered, setBrandHovered] = React.useState(false);
  React.useEffect(() => {
    sidebar.setOpen(xlUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xlUp]);
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-2 py-2">
        <div className="flex h-10 w-full items-center justify-center overflow-hidden">
          {isCollapsed && xlUp ? (
            <Image
              src="/favicon.svg"
              alt=""
              width={32}
              height={32}
              unoptimized
              className="size-8 shrink-0"
            />
          ) : (
            <BrandWordmark
              active={brandHovered}
              onMouseEnter={() => setBrandHovered(true)}
              onMouseLeave={() => setBrandHovered(false)}
              className="truncate text-center font-display text-lg font-semibold tracking-tight text-foreground"
            >
              {AppInfo.APP_NAME}
            </BrandWordmark>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <ScrollArea
          verticalScrollBar
          className="h-full [&>[data-radix-scroll-area-viewport]>div]:flex [&>[data-radix-scroll-area-viewport]>div]:flex-col"
        >
          <NavMain profile={profile} />
          <NavSupport
            profile={profile}
            className="mt-auto pb-0"
          />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          profile={profile}
          className="p-0"
        />
      </SidebarFooter>
    </Sidebar>
  );
}
