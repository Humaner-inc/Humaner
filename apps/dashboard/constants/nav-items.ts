import {
  BarChart3Icon,
  BellIcon,
  BlocksIcon,
  BookOpenIcon,
  BotIcon,
  CreditCardIcon,
  GraduationCapIcon,
  HeadsetIcon,
  HomeIcon,
  LockKeyholeIcon,
  SettingsIcon,
  StoreIcon,
  UserIcon,
  UserPlus2Icon
} from '@humaner/shared/icons';

import { Routes } from '@/constants/routes';
import type { NavItem } from '@/types/nav-item';

export const mainNavItems: NavItem[] = [
  {
    title: 'Overview',
    href: Routes.Home,
    icon: HomeIcon
  },
  {
    title: 'Agents',
    href: Routes.Agents,
    icon: BotIcon
  },
  {
    title: 'Knowledge',
    href: Routes.Knowledge,
    icon: BookOpenIcon
  },
  {
    title: 'Training',
    href: Routes.Training,
    icon: GraduationCapIcon
  },
  {
    title: 'Integrations',
    href: Routes.Integrations,
    icon: BlocksIcon
  },
  {
    title: 'Analytics',
    href: Routes.Analytics,
    icon: BarChart3Icon
  },
  {
    title: 'Human Desk',
    href: Routes.HumanDesk,
    icon: HeadsetIcon
  },
  {
    title: 'Settings',
    href: Routes.Settings,
    icon: SettingsIcon
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
    icon: StoreIcon
  },
  {
    title: 'Members',
    href: Routes.Members,
    icon: UserPlus2Icon
  },
  {
    title: 'Billing',
    href: Routes.Billing,
    icon: CreditCardIcon
  }
];
