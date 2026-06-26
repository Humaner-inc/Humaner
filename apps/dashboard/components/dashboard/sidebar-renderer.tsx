'use client';

import * as React from 'react';

import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { SidebarEdgeToggle } from '@/components/dashboard/sidebar-edge-toggle';
import { ProfileDto } from '@/types/dtos/profile-dto';

export type SidebarRendererProps = {
  profile: ProfileDto;
};

export function SidebarRenderer({
  profile
}: SidebarRendererProps): React.JSX.Element {
  return (
    <>
      <AppSidebar profile={profile} />
      <SidebarEdgeToggle />
    </>
  );
}
