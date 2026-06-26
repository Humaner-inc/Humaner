import { Role, WorkspaceRole } from '@prisma/client';

import {
  type DashboardPageKey,
  resolvePathAccess
} from '@/constants/dashboard-pages';
import type { NavItem } from '@/types/nav-item';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export function isWorkspaceOwner(profile: Pick<ProfileDto, 'workspaceRole'>): boolean {
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

  return profile.allowedPages.includes(pageKey);
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

export function canAccessNavItem(
  profile: ProfileDto,
  item: NavItem
): boolean {
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
