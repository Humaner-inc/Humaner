import type { LucideIcon } from '@humaner/shared/icons';
import { BotIcon, Layers } from '@humaner/shared/icons';
import type { PlanCapabilities } from '@humaner/shared/plans';
import { getPlanCapabilities } from '@humaner/shared/plans';

import { Routes } from '@/constants/routes';

export type DeskNavTabId = 'ai' | 'human' | 'clusters';

export type DeskNavTab = {
  id: DeskNavTabId;
  label: string;
  icon?: LucideIcon;
  iconKey?: 'hand';
  href: string;
  requiredCapability?: keyof PlanCapabilities;
};

export const DESK_NAV_TABS: DeskNavTab[] = [
  {
    id: 'ai',
    label: 'AI Desk',
    icon: BotIcon,
    href: Routes.DeskAI
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
    href: Routes.DeskClusters
  }
];

export function getActiveDeskTab(pathname: string): DeskNavTabId | null {
  if (pathname.startsWith(Routes.DeskAI)) {
    return 'ai';
  }
  if (pathname.startsWith(Routes.DeskHuman)) {
    return 'human';
  }
  if (pathname.startsWith(Routes.DeskClusters)) {
    return 'clusters';
  }
  return null;
}

export function isDeskPath(pathname: string): boolean {
  return pathname.startsWith(Routes.Desk);
}

export function isDeskTabLocked(tab: DeskNavTab, orgTier: string): boolean {
  if (!tab.requiredCapability) return false;
  const capabilities = getPlanCapabilities(orgTier);
  return !capabilities[tab.requiredCapability];
}
