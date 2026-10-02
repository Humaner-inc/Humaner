import { Routes } from '@/constants/routes';
import { getSafeAuthCallbackUrl } from '@/lib/auth/callback-url';
import { getPathname } from '@/lib/network/get-pathname';
import {
  getSignedInHomePath,
  isDefaultSignedInHomePath
} from '@/lib/routes/signed-in-home';

/**
 * Send unauthenticated users to the app login page (not Auth.js /api/auth/signin).
 * Default homes omit `callbackUrl` so logout → login never sticks on `/overview`.
 */
export function getLoginRedirect(): string {
  const pathname = getPathname();
  if (!pathname || isDefaultSignedInHomePath(pathname)) {
    return Routes.Login;
  }

  const callbackUrl = getSafeAuthCallbackUrl(pathname, getSignedInHomePath());
  if (isDefaultSignedInHomePath(callbackUrl)) {
    return Routes.Login;
  }

  return `${Routes.Login}?${new URLSearchParams({ callbackUrl })}`;
}
