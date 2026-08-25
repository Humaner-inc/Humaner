'use client';

import * as React from 'react';

import { AppSidebar } from '@/components/dashboard/app-sidebar';
import type { SidebarAgent } from '@/components/dashboard/nav-agent-tree';
import { SidebarEdgeToggle } from '@/components/dashboard/sidebar-edge-toggle';
import { SidebarOverlayBackdrop } from '@/components/dashboard/sidebar-overlay-backdrop';
import type { UserWorkspaceSummary } from '@/lib/auth/workspace-membership';
import { ProfileDto } from '@/types/dtos/profile-dto';
import type { SidebarMessageUsageDto } from '@/types/dtos/sidebar-message-usage-dto';
import type { SidebarTrialStatusDto } from '@/types/dtos/sidebar-trial-status-dto';

export type SidebarRendererProps = {
  profile: ProfileDto;
  workspaces: UserWorkspaceSummary[];
  messageUsage: SidebarMessageUsageDto;
  trialStatus?: SidebarTrialStatusDto | null;
  agents: SidebarAgent[];
  orgTier: string;
  frontierBetaEnabled?: boolean;
  inboxUnreadCount?: number;
  handoffOpenCount?: number;
  agentDeskOpenCount?: number;
};

export function SidebarRenderer({
  profile,
  workspaces,
  messageUsage,
  trialStatus = null,
  agents,
  orgTier,
  frontierBetaEnabled = true,
  inboxUnreadCount = 0,
  handoffOpenCount = 0,
  agentDeskOpenCount = 0
}: SidebarRendererProps): React.JSX.Element {
  return (
    <>
      <AppSidebar
        profile={profile}
        workspaces={workspaces}
        messageUsage={messageUsage}
        trialStatus={trialStatus}
        agents={agents}
        orgTier={orgTier}
        frontierBetaEnabled={frontierBetaEnabled}
        inboxUnreadCount={inboxUnreadCount}
        handoffOpenCount={handoffOpenCount}
        agentDeskOpenCount={agentDeskOpenCount}
      />
      <SidebarOverlayBackdrop />
      <SidebarEdgeToggle />
    </>
  );
}
