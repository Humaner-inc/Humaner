'use client';

import * as React from 'react';

import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { ProfileDto } from '@/types/dtos/profile-dto';

export type SidebarRendererProps = {
  profile: ProfileDto;
};

export function SidebarRenderer(
  props: SidebarRendererProps
): React.JSX.Element {
  return <AppSidebar {...props} />;
}
