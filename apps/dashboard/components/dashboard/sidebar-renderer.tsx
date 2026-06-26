'use client';

import * as React from 'react';

import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { SidebarEdgeToggle } from '@/components/dashboard/sidebar-edge-toggle';
import type { UserWorkspaceSummary } from '@/lib/auth/workspace-membership';
import { ProfileDto } from '@/types/dtos/profile-dto';

export type SidebarRendererProps = {
  profile: ProfileDto;
  workspaces: UserWorkspaceSummary[];
};

export function SidebarRenderer({
  profile,
  workspaces
}: SidebarRendererProps): React.JSX.Element {
  return (
    <>
      <AppSidebar
        profile={profile}
        workspaces={workspaces}
      />
      <SidebarEdgeToggle />
    </>
  );
}
