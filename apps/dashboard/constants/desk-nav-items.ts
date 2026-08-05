import type { LucideIcon } from '@humaner/shared/icons';
import { BotIcon, Layers, SettingsIcon } from '@humaner/shared/icons';
import type { PlanCapabilities } from '@humaner/shared/plans';
import { getPlanCapabilities } from '@humaner/shared/plans';

import { AppInfo } from '@/constants/app-info';
import { Routes } from '@/constants/routes';
import { isOssDeployment } from '@/lib/deployment-mode';

export type DeskNavTabId = 'agent' | 'human' | 'clusters' | 'settings';

export type DeskNavTab = {
  id: DeskNavTabId;
  label: string;
  icon?: LucideIcon;
  iconKey?: 'hand';
  href: string;
  requiredCapability?: keyof PlanCapabilities;
};

const CLOUD_DESK_NAV_TABS: DeskNavTab[] = [
  {
    id: 'agent',
    label: 'Agent Desk',
    icon: BotIcon,
    href: Routes.DeskAgent,
    requiredCapability: 'agentDesk'
  },
  {
    id: 'human',
    label: 'Human Desk',
    iconKey: 'hand',
    href: Routes.DeskHuman,
    requiredCapability: 'humanDeskEmail'
  },
  {
    id: 'clusters',
    label: 'Clusters',
    icon: Layers,
    href: Routes.DeskClusters,
    requiredCapability: 'autoTraining'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: SettingsIcon,
    href: Routes.DeskSettings
  }
];

/** @deprecated Prefer getDeskNavTabs() — Cloud full list for type/legacy imports. */
export const DESK_NAV_TABS: DeskNavTab[] = CLOUD_DESK_NAV_TABS;

/** Visible desk tabs for the current deployment mode. */
export function getDeskNavTabs(): DeskNavTab[] {
  if (isOssDeployment()) {
    return [
      {
        id: 'human',
        label: AppInfo.HELPDESK_LABEL,
        iconKey: 'hand',
        href: Routes.DeskHuman
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: SettingsIcon,
        href: Routes.DeskSettings
      }
    ];
  }
  return CLOUD_DESK_NAV_TABS;
}

export function getDeskHomeHref(orgTier?: string): string {
  if (isOssDeployment()) return Routes.DeskHuman;
  if (orgTier && !getPlanCapabilities(orgTier).agentDesk) {
    return Routes.DeskHuman;
  }
  return Routes.DeskAgent;
}

export function getActiveDeskTab(pathname: string): DeskNavTabId | null {
  if (pathname.startsWith(Routes.DeskAgent)) {
    return 'agent';
  }
  if (pathname.startsWith(Routes.DeskHuman)) {
    return 'human';
  }
  if (pathname.startsWith(Routes.DeskClusters)) {
    return 'clusters';
  }
  if (pathname.startsWith(Routes.DeskSettings)) {
    return 'settings';
  }
  return null;
}

export function isDeskPath(pathname: string): boolean {
  return pathname.startsWith(Routes.Desk);
}

export function isDeskTabLocked(tab: DeskNavTab, orgTier: string): boolean {
  if (isOssDeployment()) return false;
  if (!tab.requiredCapability) return false;
  const capabilities = getPlanCapabilities(orgTier);
  return !capabilities[tab.requiredCapability];
}
