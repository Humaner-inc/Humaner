import { Routes } from '@/constants/routes';
import { getSafeAuthCallbackUrl } from '@/lib/auth/callback-url';
import { getPathname } from '@/lib/network/get-pathname';
import { getSignedInHomePath } from '@/lib/routes/signed-in-home';

/**
 * Send unauthenticated users to the app login page (not Auth.js /api/auth/signin).
 * Auth.js sign-in rewrites callbackUrl to an absolute URL and drops the relative
 * path we need for MFA / middleware.
 */
export function getLoginRedirect(): string {
  const pathname = getPathname();
  const callbackUrl = pathname
    ? getSafeAuthCallbackUrl(pathname)
    : getSignedInHomePath();

  return `${Routes.Login}?${new URLSearchParams({ callbackUrl })}`;
}
