'use client';

import * as React from 'react';

import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { SidebarEdgeToggle } from '@/components/dashboard/sidebar-edge-toggle';
import type { UserWorkspaceSummary } from '@/lib/auth/workspace-membership';
import { ProfileDto } from '@/types/dtos/profile-dto';
import type { SidebarMessageUsageDto } from '@/types/dtos/sidebar-message-usage-dto';
import type { SidebarAgent } from '@/components/dashboard/nav-agent-tree';

export type SidebarRendererProps = {
  profile: ProfileDto;
  workspaces: UserWorkspaceSummary[];
  messageUsage: SidebarMessageUsageDto;
  agents: SidebarAgent[];
  orgTier: string;
};

export function SidebarRenderer({
  profile,
  workspaces,
  messageUsage,
  agents,
  orgTier
}: SidebarRendererProps): React.JSX.Element {
  return (
    <>
      <AppSidebar
        profile={profile}
        workspaces={workspaces}
        messageUsage={messageUsage}
        agents={agents}
        orgTier={orgTier}
      />
      <SidebarEdgeToggle />
    </>
  );
}
