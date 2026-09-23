'use client';

import * as React from 'react';
import { XIcon } from '@humaner/shared/icons';

import { HumanerBrandTitle } from '@/components/brand/humaner-brand-title';
import type { SidebarAgent } from '@/components/dashboard/nav-agent-tree';
import type { ConnectorNavItem } from '@/components/dashboard/nav-connectors';
import { NavMain } from '@/components/dashboard/nav-main';
import { SidebarMessageUsage } from '@/components/dashboard/sidebar-message-usage';
import { WorkspaceSwitcher } from '@/components/dashboard/workspace/workspace-switcher';
import { Button } from '@/components/ui/button';
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
  showCompanionUpgrade?: boolean;
  connectors?: ConnectorNavItem[];
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
  companionHref,
  showCompanionUpgrade = false,
  connectors = []
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
        <div className="relative flex size-full min-w-0 items-center justify-center overflow-hidden">
          {isCollapsed ? (
            <span
              aria-hidden
              className="inline-block size-7 shrink-0 bg-[#0A0D0D] dark:bg-[#f2f2f2]"
              style={{
                WebkitMaskImage: 'url(/brandmark_blue.svg)',
                maskImage: 'url(/brandmark_blue.svg)',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                WebkitMaskSize: 'contain',
                maskSize: 'contain'
              }}
            />
          ) : (
            <HumanerBrandTitle
              name={appName}
              className="min-w-0 justify-center"
              wordmarkClassName="truncate text-center font-display text-lg font-normal tracking-tight text-[#0A0D0D] dark:text-[#e0e1df]"
            />
          )}
          {sidebar.isMobileFullPage ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 size-9 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => sidebar.setOpen(false)}
              aria-label="Close navigation"
            >
              <XIcon className="size-4" />
            </Button>
          ) : null}
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
            connectors={connectors}
          />
        </ScrollArea>
      </SidebarContent>
      <div className="mt-auto min-w-0">
        {!oss ? (
          <SidebarMessageUsage
            usage={messageUsage}
            companionHref={companionHref}
            showCompanionUpgrade={showCompanionUpgrade}
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
