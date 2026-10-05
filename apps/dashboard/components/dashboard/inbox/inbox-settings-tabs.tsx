'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { CompanionFigure } from '@humaner/shared/companion-icon';
import { MailIcon, PlugIcon, SettingsIcon } from '@humaner/shared/icons';

import { SettingsTabBar } from '@/components/dashboard/settings/settings-tab-bar';
import { Routes } from '@/constants/routes';
import { isOssDeployment } from '@/lib/deployment-mode';
import { cn } from '@/lib/utils';

export type WorkspaceSettingsTab =
  | 'connect'
  | 'inbox'
  | 'companion'
  | 'settings';

function CompanionTabIcon({
  className
}: {
  className?: string;
}): React.JSX.Element {
  return (
    <CompanionFigure
      size={14}
      state="idle"
      tone="mono"
      className={cn(
        'text-[#0A0D0D] dark:text-[#f2f2f2] [.bg-foreground_&]:text-current',
        className
      )}
    />
  );
}

export function InboxSettingsTabs({
  active,
  className
}: {
  active: WorkspaceSettingsTab;
  className?: string;
}): React.JSX.Element {
  const pathname = usePathname() ?? '';
  const settingsHref =
    isOssDeployment() || pathname.startsWith(Routes.OrganizationWorkspace)
      ? Routes.OrganizationWorkspace
      : `${Routes.InboxSettings}?tab=settings`;

  const tabs: Array<{
    id: WorkspaceSettingsTab;
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'connect',
      label: 'Connect',
      href: Routes.InboxSettings,
      icon: PlugIcon
    },
    {
      id: 'inbox',
      label: 'Inbox',
      href: `${Routes.InboxSettings}?tab=inbox`,
      icon: MailIcon
    },
    {
      id: 'companion',
      label: 'Companion',
      href: `${Routes.InboxSettings}?tab=companion`,
      icon: CompanionTabIcon
    },
    {
      id: 'settings',
      label: 'Settings',
      href: settingsHref,
      icon: SettingsIcon
    }
  ];

  return (
    <SettingsTabBar
      ariaLabel="Workspace settings"
      className={className}
      tabs={tabs.map((tab) => ({
        ...tab,
        active: active === tab.id
      }))}
    />
  );
}
