import {
  BellIcon,
  CreditCardIcon,
  LockKeyholeIcon,
  MessageSquare,
  StoreIcon,
  UserIcon
} from '@humaner/shared/icons';

import { Routes } from '@/constants/routes';
import type { NavItem } from '@/types/nav-item';

export const mainNavItems: NavItem[] = [];

/** Platform-operator tools (Humaner staff). Never shown to regular users. */
export const adminNavItems: NavItem[] = [
  {
    title: 'Support tickets',
    href: Routes.AdminTickets,
    icon: MessageSquare,
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
    href: Routes.OrganizationInformation,
    icon: StoreIcon,
    ownerOnly: true
  },
  {
    title: 'Billing',
    href: Routes.Billing,
    icon: CreditCardIcon,
    ownerOnly: true
  }
];
