'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Routes } from '@/constants/routes';
import {
  ACCOUNT_SETTINGS_NAV_TABS,
  getActiveSettingsTab,
  isWorkspaceSettingsPath,
  WORKSPACE_SETTINGS_NAV_TABS
} from '@/constants/settings-nav-items';
import { isWorkspaceOwner } from '@/lib/auth/workspace-access';
import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export type SettingsNavTabsProps = {
  profile: ProfileDto;
  className?: string;
};

export function SettingsNavTabs({
  profile,
  className
}: SettingsNavTabsProps): React.JSX.Element {
  const pathname = usePathname();
  if (pathname.startsWith(Routes.Developers)) {
    return <></>;
  }
  const activeTab = getActiveSettingsTab(pathname);
  const isOwner = isWorkspaceOwner(profile);
  const isWorkspaceSettings = isWorkspaceSettingsPath(pathname);
  const tabs = (
    isWorkspaceSettings
      ? WORKSPACE_SETTINGS_NAV_TABS
      : ACCOUNT_SETTINGS_NAV_TABS
  ).filter((tab) => !tab.ownerOnly || isOwner);

  return (
    <nav
      aria-label={
        isWorkspaceSettings ? 'Workspace settings' : 'Account settings'
      }
      className={cn(
        'mb-6 flex flex-wrap items-center gap-1 border-b border-border/60 pb-3',
        className
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium transition-colors',
              dashboardRadiusClassName,
              active
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
