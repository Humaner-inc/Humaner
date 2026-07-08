import {
  BarChart3Icon,
  BellIcon,
  BlocksIcon,
  BookOpenIcon,
  ClockIcon,
  CreditCardIcon,
  HeadsetIcon,
  HomeIcon,
  LockKeyholeIcon,
  MessageSquare,
  SettingsIcon,
  SquareDashedKanbanIcon,
  StoreIcon,
  UserIcon,
  UserPlus2Icon
} from '@humaner/shared/icons';

import { Routes } from '@/constants/routes';
import type { NavItem } from '@/types/nav-item';

export const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: Routes.Home,
    icon: HomeIcon,
    pageKey: 'overview'
  },
  {
    title: 'Knowledge',
    href: Routes.Knowledge,
    icon: BookOpenIcon,
    pageKey: 'knowledge'
  },
  {
    title: 'Integrations',
    href: Routes.Integrations,
    icon: BlocksIcon,
    pageKey: 'integrations'
  },
  {
    title: 'Analytics',
    href: Routes.Analytics,
    icon: BarChart3Icon,
    pageKey: 'analytics'
  },
  {
    title: 'History',
    href: Routes.History,
    icon: ClockIcon,
    pageKey: 'history'
  },
  {
    title: 'Desk',
    href: Routes.Desk,
    icon: SquareDashedKanbanIcon,
    pageKey: 'desk'
  },
  {
    title: 'Settings',
    href: Routes.Settings,
    icon: SettingsIcon,
    pageKey: 'settings'
  }
];

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
    title: 'Members',
    href: Routes.Members,
    icon: UserPlus2Icon,
    ownerOnly: true
  },
  {
    title: 'Billing',
    href: Routes.Billing,
    icon: CreditCardIcon,
    ownerOnly: true
  }
];
