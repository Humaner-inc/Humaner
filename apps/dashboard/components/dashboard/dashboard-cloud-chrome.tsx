'use client';

import * as React from 'react';

import { DashboardSectionProvider } from '@/components/dashboard/dashboard-section-context';
import {
  DashboardTopNav,
  type DashboardTopNavProps
} from '@/components/dashboard/dashboard-top-nav';
import {
  SidebarRenderer,
  type SidebarRendererProps
} from '@/components/dashboard/sidebar-renderer';
import { SidebarInset } from '@/components/ui/sidebar';
import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export type DashboardCloudChromeProps = {
  /** Cloud sections. Self-Host keeps the tree nav and skips the provider. */
  sections: boolean;
  profile: ProfileDto;
  topNav: Omit<DashboardTopNavProps, 'profile'>;
  sidebar: Omit<SidebarRendererProps, 'profile'>;
  children: React.ReactNode;
};

/**
 * Renders the section provider in the same client tree as the top bar and
 * sidebar. Composing them from the server shell leaves the sidebar outside
 * the provider during render.
 */
export function DashboardCloudChrome({
  sections,
  profile,
  topNav,
  sidebar,
  children
}: DashboardCloudChromeProps): React.JSX.Element {
  const frame = (
    <>
      <DashboardTopNav
        profile={profile}
        {...topNav}
      />
      <div className="relative flex min-h-0 flex-1 gap-2 px-2 pb-2 max-md:gap-0 max-md:p-0">
        <SidebarRenderer
          profile={profile}
          {...sidebar}
        />
        <SidebarInset
          id="skip"
          className={cn(
            'min-h-0 min-w-0 flex-1 overflow-hidden ring-1 ring-border/60 max-md:rounded-none max-md:ring-0',
            dashboardRadiusClassName
          )}
        >
          {children}
        </SidebarInset>
      </div>
    </>
  );

  if (!sections) {
    return frame;
  }

  return (
    <DashboardSectionProvider profile={profile}>
      {frame}
    </DashboardSectionProvider>
  );
}
