'use client';

import * as React from 'react';

import { AppSidebar } from '@/components/dashboard/app-sidebar';
import type { SidebarAgent } from '@/components/dashboard/nav-agent-tree';
import { SidebarEdgeToggle } from '@/components/dashboard/sidebar-edge-toggle';
import { SidebarOverlayBackdrop } from '@/components/dashboard/sidebar-overlay-backdrop';
import type { UserWorkspaceSummary } from '@/lib/auth/workspace-membership';
import { ProfileDto } from '@/types/dtos/profile-dto';
import type { SidebarMessageUsageDto } from '@/types/dtos/sidebar-message-usage-dto';

export type SidebarRendererProps = {
  profile: ProfileDto;
  workspaces: UserWorkspaceSummary[];
  messageUsage: SidebarMessageUsageDto;
  agents: SidebarAgent[];
  orgTier: string;
  inboxUnreadCount?: number;
  handoffOpenCount?: number;
};

export function SidebarRenderer({
  profile,
  workspaces,
  messageUsage,
  agents,
  orgTier,
  inboxUnreadCount = 0,
  handoffOpenCount = 0
}: SidebarRendererProps): React.JSX.Element {
  return (
    <>
      <AppSidebar
        profile={profile}
        workspaces={workspaces}
        messageUsage={messageUsage}
        agents={agents}
        orgTier={orgTier}
        inboxUnreadCount={inboxUnreadCount}
        handoffOpenCount={handoffOpenCount}
      />
      <SidebarOverlayBackdrop />
      <SidebarEdgeToggle />
    </>
  );
}
