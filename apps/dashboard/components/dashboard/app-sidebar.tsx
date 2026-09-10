'use client';

import * as React from 'react';

import { HumanerBrandTitle } from '@/components/brand/humaner-brand-title';
import { HumanerLogoImage } from '@/components/brand/humaner-logo-image';
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
import type { MailInboxOption } from '@/data/inbox/get-mail-threads';
import type { UserWorkspaceSummary } from '@/lib/auth/workspace-membership';
import { isOssDeployment } from '@/lib/deployment-mode';
import type { ProfileDto } from '@/types/dtos/profile-dto';
import type { SidebarMessageUsageDto } from '@/types/dtos/sidebar-message-usage-dto';

export type AppSidebarProps = {
  profile: ProfileDto;
  workspaces: UserWorkspaceSummary[];
  messageUsage: SidebarMessageUsageDto;
  agents: SidebarAgent[];
  orgTier: string;
  frontierBetaEnabled?: boolean;
  inboxUnreadCount?: number;
  handoffOpenCount?: number;
  agentDeskOpenCount?: number;
  mailInboxes?: MailInboxOption[];
  companionHref?: string | null;
};

export function AppSidebar({
  profile,
  workspaces,
  messageUsage,
  agents,
  orgTier,
  frontierBetaEnabled = true,
  inboxUnreadCount = 0,
  handoffOpenCount = 0,
  agentDeskOpenCount = 0,
  mailInboxes = [],
  companionHref
}: AppSidebarProps): React.JSX.Element {
  const sidebar = useSidebar();
  const isCollapsed = !sidebar.open;
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
            <HumanerLogoImage
              width={32}
              height={32}
              className="size-7 shrink-0"
            />
          ) : (
            <HumanerBrandTitle
              name={appName}
              className="min-w-0"
              wordmarkClassName="truncate text-center font-display text-lg font-normal tracking-tight text-[#0A0D0D] dark:text-[#e0e1df]"
            />
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
            frontierBetaEnabled={frontierBetaEnabled}
            inboxUnreadCount={inboxUnreadCount}
            handoffOpenCount={handoffOpenCount}
            agentDeskOpenCount={agentDeskOpenCount}
            mailInboxes={mailInboxes}
            companionHref={companionHref}
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
