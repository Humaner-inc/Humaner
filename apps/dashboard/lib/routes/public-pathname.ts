import { Routes } from '@/constants/routes';

/** Internal Next.js app segment — never shown in user-facing URLs or meta links. */
export const INTERNAL_APP_PREFIX = '/dashboard';

const LEGACY_HOME_PATHS: Record<string, string> = {
  '/dashboard/home': Routes.Home,
  '/dashboard/home/team': Routes.OrganizationTeam,
  '/dashboard/home/workspace': Routes.OrganizationWorkspace
};

/** Maps an internal or legacy pathname to the public URL shown in the app and meta tags. */
export function toPublicPathname(pathname: string): string {
  if (LEGACY_HOME_PATHS[pathname]) {
    return LEGACY_HOME_PATHS[pathname];
  }

  if (pathname === INTERNAL_APP_PREFIX) {
    return Routes.Home;
  }

  if (pathname.startsWith(`${INTERNAL_APP_PREFIX}/`)) {
    return pathname.slice(INTERNAL_APP_PREFIX.length);
  }

  return pathname;
}

const PROTECTED_APP_PREFIXES = [
  '/organization',
  '/agents',
  '/desk',
  '/inbox',
  '/integrations',
  '/settings',
  '/history',
  '/analytics',
  '/knowledge',
  '/human-desk',
  '/tasks',
  '/calendar',
  '/resources',
  '/training',
  '/admin',
  '/workspace',
  INTERNAL_APP_PREFIX
] as const;

export function isProtectedAppPath(pathname: string): boolean {
  if (pathname === '/api/dashboard' || pathname.startsWith('/api/dashboard/')) {
    return true;
  }

  return PROTECTED_APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
