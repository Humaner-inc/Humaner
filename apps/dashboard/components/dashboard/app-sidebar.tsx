'use client';

import * as React from 'react';
import { XIcon } from '@humaner/shared/icons';

import { HumanerBrandTitle } from '@/components/brand/humaner-brand-title';
import { useDashboardSectionOptional } from '@/components/dashboard/dashboard-section-context';
import { DashboardSectionTabs } from '@/components/dashboard/dashboard-section-tabs';
import type { SidebarAgent } from '@/components/dashboard/nav-agent-tree';
import type { ConnectorNavItem } from '@/components/dashboard/nav-connectors';
import { NavMain } from '@/components/dashboard/nav-main';
import { SidebarMessageUsage } from '@/components/dashboard/sidebar-message-usage';
import { WorkspaceSwitcher } from '@/components/dashboard/workspace/workspace-switcher';
import { Button } from '@/components/ui/button';
import { ChevronsLeftRightIcon } from '@/components/ui/chevrons-left-right-icon';
import { ChevronsRightLeftIcon } from '@/components/ui/chevrons-right-left-icon';
import { Hint } from '@/components/ui/hint';
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
import { cn } from '@/lib/utils';
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

/** Full-page mobile nav has no top bar: brand, close, and section picker live here. */
function MobileFullPageHeader(): React.JSX.Element {
  const sidebar = useSidebar();
  const sectionNav = useDashboardSectionOptional();
  const hasSections = (sectionNav?.sections.length ?? 0) > 0;

  return (
    <SidebarHeader className="shrink-0 gap-3 border-b border-sidebar-border p-3">
      <div className="relative flex h-8 items-center justify-center">
        <HumanerBrandTitle
          name={AppInfo.APP_NAME}
          className="min-w-0 justify-center"
          wordmarkClassName="truncate text-center font-display text-lg font-normal tracking-tight text-[#0A0D0D] dark:text-[#e0e1df]"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 size-8 shrink-0 rounded-sm text-muted-foreground hover:text-foreground"
          onClick={() => sidebar.setOpen(false)}
          aria-label="Close navigation"
        >
          <XIcon className="size-4" />
        </Button>
      </div>
      {hasSections ? <DashboardSectionTabs layout="grid" /> : null}
    </SidebarHeader>
  );
}

/** Reduce / extend control pinned to the panel's top-right corner. */
function SidebarPanelToggle(): React.JSX.Element | null {
  const sidebar = useSidebar();

  if (sidebar.isMobileFullPage) {
    return null;
  }

  const collapsed = !sidebar.open;
  const label = collapsed ? 'Extend sidebar' : 'Reduce sidebar';

  return (
    <div
      className={cn(
        'z-10',
        collapsed ? 'flex justify-center pt-3' : 'absolute right-2 top-3'
      )}
    >
      <Hint
        label={`${label} · Ctrl+B`}
        side={collapsed ? 'right' : 'bottom'}
      >
        <button
          type="button"
          onClick={sidebar.toggleSidebar}
          aria-label={label}
          aria-expanded={sidebar.open}
          className="flex size-7 items-center justify-center rounded-sm text-sidebar-foreground/45 transition-colors hover:bg-sidebar-item hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring"
        >
          {collapsed ? (
            <ChevronsLeftRightIcon
              className="shrink-0 text-current"
              size={16}
            />
          ) : (
            <ChevronsRightLeftIcon
              className="shrink-0 text-current"
              size={16}
            />
          )}
        </button>
      </Hint>
    </div>
  );
}

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
  const oss = isOssDeployment();

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
    >
      {sidebar.isMobileFullPage ? <MobileFullPageHeader /> : null}
      <SidebarPanelToggle />
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
        <SidebarFooter className="min-w-0 p-2 group-data-[collapsible=icon]:px-0">
          <WorkspaceSwitcher
            variant="sidebar"
            workspaces={workspaces}
          />
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
