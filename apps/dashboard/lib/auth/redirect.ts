import { Routes } from '@/constants/routes';
import { getPathname } from '@/lib/network/get-pathname';

/**
 * Send unauthenticated users to the app login page (not Auth.js /api/auth/signin).
 * Auth.js sign-in rewrites callbackUrl to an absolute URL and drops the relative
 * path we need for MFA / middleware.
 */
export function getLoginRedirect(): string {
  const callbackUrl = getPathname();

  return callbackUrl
    ? `${Routes.Login}?${new URLSearchParams({ callbackUrl })}`
    : Routes.Login;
}
