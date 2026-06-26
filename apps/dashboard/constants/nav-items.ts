import {
  BarChart3Icon,
  BellIcon,
  BlocksIcon,
  BookOpenIcon,
  ClockIcon,
  CreditCardIcon,
  GraduationCapIcon,
  HeadsetIcon,
  HomeIcon,
  LockKeyholeIcon,
  MessageSquare,
  SettingsIcon,
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
    title: 'Training',
    href: Routes.Training,
    icon: GraduationCapIcon,
    pageKey: 'training'
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
    title: 'Human Desk',
    href: Routes.HumanDesk,
    icon: HeadsetIcon,
    pageKey: 'human-desk'
  },
  {
    title: 'Support tickets',
    href: Routes.AdminTickets,
    icon: MessageSquare,
    adminOnly: true
  },
  {
    title: 'Settings',
    href: Routes.Settings,
    icon: SettingsIcon,
    pageKey: 'settings'
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
