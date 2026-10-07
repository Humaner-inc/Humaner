import {
  ActivityIcon,
  BellIcon,
  BotIcon,
  CreditCardIcon,
  LockKeyholeIcon,
  MessageSquare,
  StoreIcon,
  UserIcon
} from '@humaner/shared/icons';

import { Routes } from '@/constants/routes';
import { isOssDeployment } from '@/lib/deployment-mode';
import type { NavItem } from '@/types/nav-item';

export const mainNavItems: NavItem[] = [];

/** Kept empty — admin tools live in the profile menu / command menu. */
export const adminNavItems: NavItem[] = [];

/** Platform-operator tools — profile popup and command menu. */
export const adminProfileItems: NavItem[] = [
  {
    title: 'Support tickets',
    href: Routes.AdminTickets,
    icon: MessageSquare,
    adminOnly: true
  },
  {
    title: 'Demo agents',
    href: Routes.AdminDemos,
    icon: BotIcon,
    adminOnly: true
  }
];

export const accountNavItems: NavItem[] = [
  {
    title: 'Profile',
    href: Routes.Profile,
    icon: UserIcon
  },
  {
    title: 'Security',
    href: Routes.Security,
    icon: LockKeyholeIcon
  },
  {
    title: 'Notifications',
    href: Routes.Notifications,
    icon: BellIcon
  }
];

export const organizationNavItems: NavItem[] = [
  {
    title: 'Information',
    href: Routes.OrganizationWorkspace,
    icon: StoreIcon,
    ownerOnly: true
  },
  ...(!isOssDeployment()
    ? [
        {
          title: 'Billing',
          href: Routes.Billing,
          icon: CreditCardIcon,
          ownerOnly: true
        } satisfies NavItem
      ]
    : []),
  {
    title: 'Audit logs',
    href: Routes.AuditLogs,
    icon: ActivityIcon,
    ownerOnly: true
  }
];
