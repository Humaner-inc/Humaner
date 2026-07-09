import type { LucideIcon } from '@humaner/shared/icons';
import {
  BellIcon,
  CreditCardIcon,
  LockKeyholeIcon,
  UserIcon,
  UserPlus2Icon
} from '@humaner/shared/icons';

import { Routes } from '@/constants/routes';

export type SettingsNavTabId =
  | 'profile'
  | 'security'
  | 'notifications'
  | 'members'
  | 'billing';

export type SettingsNavTab = {
  id: SettingsNavTabId;
  label: string;
  icon: LucideIcon;
  href: string;
  ownerOnly?: boolean;
};

export const SETTINGS_NAV_TABS: SettingsNavTab[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: UserIcon,
    href: Routes.Profile
  },
  {
    id: 'security',
    label: 'Security',
    icon: LockKeyholeIcon,
    href: Routes.Security
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: BellIcon,
    href: Routes.Notifications
  },
  {
    id: 'members',
    label: 'Members',
    icon: UserPlus2Icon,
    href: Routes.Members,
    ownerOnly: true
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: CreditCardIcon,
    href: Routes.Billing,
    ownerOnly: true
  }
];

export function getActiveSettingsTab(pathname: string): SettingsNavTabId | null {
  for (const tab of SETTINGS_NAV_TABS) {
    if (pathname.startsWith(tab.href)) {
      return tab.id;
    }
  }
  return null;
}

export function isSettingsPath(pathname: string): boolean {
  return pathname.startsWith(Routes.Settings);
}
