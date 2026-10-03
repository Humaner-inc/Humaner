import {
  getActiveMailboxFolder,
  getActiveWorkspaceSectionItem,
  isUtilitiesPath
} from '@/constants/mailbox-nav-items';
import { Routes } from '@/constants/routes';
import { canAccessPage } from '@/lib/auth/workspace-access';
import {
  HUMANER_NAV_COLORS,
  type HumanerNavColor
} from '@/lib/humaner-nav-colors';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export type DashboardSectionId =
  | 'overview'
  | 'calendar'
  | 'inbox'
  | 'workspace'
  | 'utilities';

export type DashboardSection = {
  id: DashboardSectionId;
  label: string;
  href: string;
  color: HumanerNavColor;
};

/** Top-bar order. Each section owns its own sidebar. */
export const DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    href: Routes.Overview,
    color: HUMANER_NAV_COLORS.success
  },
  {
    id: 'calendar',
    label: 'Calendar',
    href: Routes.Calendar,
    color: HUMANER_NAV_COLORS.warning
  },
  {
    id: 'inbox',
    label: 'Inbox',
    href: Routes.InboxAll,
    color: HUMANER_NAV_COLORS.info
  },
  {
    id: 'workspace',
    label: 'Workspace',
    href: Routes.Tasks,
    color: HUMANER_NAV_COLORS.yellow
  },
  {
    id: 'utilities',
    label: 'Utilities',
    href: Routes.Resources,
    color: HUMANER_NAV_COLORS.destructive
  }
];

export function canAccessDashboardSection(
  profile: ProfileDto,
  id: DashboardSectionId
): boolean {
  switch (id) {
    case 'overview':
      return true;
    case 'calendar':
      return canAccessPage(profile, 'calendar');
    case 'inbox':
    case 'utilities':
      return canAccessPage(profile, 'inbox');
    case 'workspace':
      return canAccessPage(profile, 'tasks') || canAccessPage(profile, 'inbox');
  }
}

export function getVisibleDashboardSections(
  profile: ProfileDto
): DashboardSection[] {
  return DASHBOARD_SECTIONS.filter((section) =>
    canAccessDashboardSection(profile, section.id)
  );
}

/** `null` for pages outside every section (settings, agents, …). */
export function getDashboardSectionForPath(
  pathname: string
): DashboardSectionId | null {
  if (
    pathname.startsWith(Routes.Overview) ||
    pathname.startsWith(Routes.Home) ||
    pathname.startsWith(Routes.Contacts)
  ) {
    return 'overview';
  }
  if (pathname.startsWith(Routes.Calendar)) return 'calendar';
  if (getActiveMailboxFolder(pathname)) return 'inbox';
  if (getActiveWorkspaceSectionItem(pathname)) return 'workspace';
  if (isUtilitiesPath(pathname)) return 'utilities';
  return null;
}
