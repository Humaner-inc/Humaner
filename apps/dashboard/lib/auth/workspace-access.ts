import { Role, WorkspaceRole } from '@prisma/client';

import {
  resolvePathAccess,
  type DashboardPageKey
} from '@/constants/dashboard-pages';
import type { ProfileDto } from '@/types/dtos/profile-dto';
import type { NavItem } from '@/types/nav-item';

export function isWorkspaceOwner(
  profile: Pick<ProfileDto, 'workspaceRole'>
): boolean {
  return profile.workspaceRole === WorkspaceRole.OWNER;
}

export function isPlatformAdmin(profile: Pick<ProfileDto, 'role'>): boolean {
  return profile.role === Role.ADMIN;
}

export function canAccessPage(
  profile: Pick<ProfileDto, 'role' | 'workspaceRole' | 'allowedPages'>,
  pageKey: DashboardPageKey
): boolean {
  if (isPlatformAdmin(profile)) {
    return true;
  }

  if (isWorkspaceOwner(profile)) {
    return true;
  }

  if (profile.allowedPages.includes(pageKey)) {
    return true;
  }

  if (pageKey === 'agents' && profile.allowedPages.includes('overview')) {
    return true;
  }

  if (pageKey === 'overview' && profile.allowedPages.includes('agents')) {
    return true;
  }

  if (pageKey === 'desk' && profile.allowedPages.includes('human-desk')) {
    return true;
  }

  if (pageKey === 'human-desk' && profile.allowedPages.includes('desk')) {
    return true;
  }

  if (
    (pageKey === 'tasks' || pageKey === 'calendar') &&
    profile.allowedPages.includes('inbox')
  ) {
    return true;
  }

  return false;
}

export function canAccessPathname(
  profile: Pick<ProfileDto, 'role' | 'workspaceRole' | 'allowedPages'>,
  pathname: string
): boolean {
  if (isPlatformAdmin(profile)) {
    return true;
  }

  const resolved = resolvePathAccess(pathname);

  switch (resolved.type) {
    case 'account':
    case 'unknown':
      return true;
    case 'owner':
      return isWorkspaceOwner(profile);
    case 'platform-admin':
      return isPlatformAdmin(profile);
    case 'page':
      return canAccessPage(profile, resolved.pageKey);
    default:
      return true;
  }
}

export function filterNavItemsForProfile(
  items: NavItem[],
  profile: ProfileDto
): NavItem[] {
  return items.filter((item) => canAccessNavItem(profile, item));
}

export function canAccessNavItem(profile: ProfileDto, item: NavItem): boolean {
  if (item.adminOnly && !isPlatformAdmin(profile)) {
    return false;
  }

  if (item.ownerOnly && !isWorkspaceOwner(profile)) {
    return false;
  }

  if (!item.pageKey) {
    return true;
  }

  return canAccessPage(profile, item.pageKey);
}
