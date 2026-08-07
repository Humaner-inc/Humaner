import type { LucideIcon } from '@humaner/shared/icons';
import {
  BellIcon,
  CreditCardIcon,
  LockKeyholeIcon,
  SettingsIcon,
  UserIcon,
  UsersIcon
} from '@humaner/shared/icons';

import { Routes } from '@/constants/routes';
import { isOssDeployment } from '@/lib/deployment-mode';

export type AccountSettingsNavTabId =
  | 'profile'
  | 'security'
  | 'notifications'
  | 'billing';

export type WorkspaceSettingsNavTabId = 'workspace' | 'members';

export type SettingsNavTabId =
  | AccountSettingsNavTabId
  | WorkspaceSettingsNavTabId;

export type SettingsNavTab = {
  id: SettingsNavTabId;
  label: string;
  icon: LucideIcon;
  href: string;
  ownerOnly?: boolean;
};

export const ACCOUNT_SETTINGS_NAV_TABS: SettingsNavTab[] = [
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
  ...(!isOssDeployment()
    ? [
        {
          id: 'billing' as const,
          label: 'Billing',
          icon: CreditCardIcon,
          href: Routes.Billing,
          ownerOnly: true
        } satisfies SettingsNavTab
      ]
    : [])
];

export const WORKSPACE_SETTINGS_NAV_TABS: SettingsNavTab[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    icon: SettingsIcon,
    href: Routes.OrganizationInformation,
    ownerOnly: true
  },
  {
    id: 'members',
    label: 'Team Members',
    icon: UsersIcon,
    href: Routes.Members,
    ownerOnly: true
  }
];

/** @deprecated Prefer ACCOUNT / WORKSPACE tab lists. */
export const SETTINGS_NAV_TABS: SettingsNavTab[] = [
  ...ACCOUNT_SETTINGS_NAV_TABS,
  ...WORKSPACE_SETTINGS_NAV_TABS
];

export function isWorkspaceSettingsPath(pathname: string): boolean {
  if (pathname.startsWith(Routes.Billing)) {
    return false;
  }
  return (
    pathname.startsWith(Routes.OrganizationInformation) ||
    pathname.startsWith(Routes.Members) ||
    pathname.startsWith(Routes.Developers) ||
    pathname.startsWith(Routes.AuditLogs) ||
    pathname.startsWith(`${Routes.Organization}/`)
  );
}

export function getActiveSettingsTab(
  pathname: string
): SettingsNavTabId | null {
  const tabs = isWorkspaceSettingsPath(pathname)
    ? WORKSPACE_SETTINGS_NAV_TABS
    : ACCOUNT_SETTINGS_NAV_TABS;

  const ordered = [...tabs].toSorted((a, b) => b.href.length - a.href.length);
  for (const tab of ordered) {
    if (pathname.startsWith(tab.href)) {
      return tab.id;
    }
  }
  return null;
}

export function isSettingsPath(pathname: string): boolean {
  return pathname.startsWith(Routes.Settings);
}
