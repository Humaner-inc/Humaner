'use client';

import * as React from 'react';
import Image from 'next/image';
import { BrandWordmark } from '@humaner/shared/brand-wordmark';

import type { SidebarAgent } from '@/components/dashboard/nav-agent-tree';
import { NavMain } from '@/components/dashboard/nav-main';
import { SidebarMessageUsage } from '@/components/dashboard/sidebar-message-usage';
import { WorkspaceSwitcher } from '@/components/dashboard/workspace/workspace-switcher';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar
} from '@/components/ui/sidebar';
import { AppInfo } from '@/constants/app-info';
import type { UserWorkspaceSummary } from '@/lib/auth/workspace-membership';
import { isOssDeployment } from '@/lib/deployment-mode';
import { getBrandFavicon } from '@/lib/theme/brand';
import type { ProfileDto } from '@/types/dtos/profile-dto';
import type { SidebarMessageUsageDto } from '@/types/dtos/sidebar-message-usage-dto';

export type AppSidebarProps = {
  profile: ProfileDto;
  workspaces: UserWorkspaceSummary[];
  messageUsage: SidebarMessageUsageDto;
  agents: SidebarAgent[];
  orgTier: string;
  inboxUnreadCount?: number;
  handoffOpenCount?: number;
  agentDeskOpenCount?: number;
};

export function AppSidebar({
  profile,
  workspaces,
  messageUsage,
  agents,
  orgTier,
  inboxUnreadCount = 0,
  handoffOpenCount = 0,
  agentDeskOpenCount = 0
}: AppSidebarProps): React.JSX.Element {
  const sidebar = useSidebar();
  const isCollapsed = !sidebar.open;
  const [brandHovered, setBrandHovered] = React.useState(false);
  const oss = isOssDeployment();
  const appName = AppInfo.APP_NAME;

  return (
    <Sidebar
      collapsible="icon"
      className="bg-sidebar/95 backdrop-blur-xl"
    >
      <SidebarHeader className="h-14 shrink-0 justify-center border-b border-sidebar-border p-2">
        <div className="flex size-full min-w-0 items-center justify-center overflow-hidden">
          {isCollapsed ? (
            oss ? (
              <div className="flex size-8 items-center justify-center rounded-md border border-sidebar-border text-sidebar-foreground">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M7.81815 8.36373L12 0L24 24H15.2809L7.81815 8.36373Z" />
                  <path d="M4.32142 15.3572L8.44635 24H0L4.32142 15.3572Z" />
                </svg>
              </div>
            ) : (
              <Image
                src={getBrandFavicon()}
                alt=""
                width={32}
                height={32}
                unoptimized
                className="size-8 shrink-0"
              />
            )
          ) : oss ? (
            <span className="truncate text-center font-sans text-lg font-semibold tracking-tight text-sidebar-foreground">
              {appName}
            </span>
          ) : (
            <BrandWordmark
              active={brandHovered}
              hoverText={appName}
              onMouseEnter={() => setBrandHovered(true)}
              onMouseLeave={() => setBrandHovered(false)}
              className="truncate text-center font-display text-lg font-semibold tracking-tight text-sidebar-foreground"
            >
              {appName}
            </BrandWordmark>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="min-h-0 overflow-hidden">
        <ScrollArea
          verticalScrollBar
          className="h-full min-w-0 [&>[data-radix-scroll-area-viewport]>div]:flex [&>[data-radix-scroll-area-viewport]>div]:min-w-0 [&>[data-radix-scroll-area-viewport]>div]:flex-col"
        >
          <NavMain
            profile={profile}
            agents={agents}
            orgTier={orgTier}
            inboxUnreadCount={inboxUnreadCount}
            handoffOpenCount={handoffOpenCount}
            agentDeskOpenCount={agentDeskOpenCount}
          />
        </ScrollArea>
      </SidebarContent>
      <div className="mt-auto min-w-0 border-t border-sidebar-border/60">
        {!oss ? (
          <SidebarMessageUsage
            usage={messageUsage}
            className="pt-2"
          />
        ) : null}
        <SidebarFooter className="min-w-0 p-2">
          <WorkspaceSwitcher
            variant="sidebar"
            workspaces={workspaces}
          />
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
