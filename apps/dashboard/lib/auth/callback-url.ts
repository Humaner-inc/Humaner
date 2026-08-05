import { Routes } from '@/constants/routes';

const AUTH_CALLBACK_BLOCKLIST = new Set<string>([
  Routes.Auth,
  Routes.Login,
  Routes.Logout,
  Routes.SignUp,
  Routes.AuthError,
  Routes.Totp,
  Routes.RecoveryCode,
  Routes.ForgotPassword,
  Routes.ForgotPasswordSuccess,
  Routes.ResetPassword,
  Routes.ResetPasswordExpired,
  Routes.ResetPasswordSuccess,
  Routes.VerifyEmail,
  Routes.VerifyEmailExpired,
  Routes.VerifyEmailSuccess,
  Routes.ChangeEmail,
  Routes.ChangeEmailInvalid,
  Routes.ChangeEmailExpired
]);

/**
 * Normalize any callback to same-origin relative path, or null.
 * Rejects protocol-relative (`//evil.com`), auth routes, and `/api/auth/*`
 */
export function toSafeRelativeCallbackPath(
  callbackUrl: string | undefined | null
): string | null {
  if (!callbackUrl?.trim()) {
    return null;
  }

  let relative = callbackUrl.trim();

  try {
    if (relative.startsWith('http://') || relative.startsWith('https://')) {
      const url = new URL(relative);
      relative = `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return null;
  }

  if (!relative.startsWith('/') || relative.startsWith('//')) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(relative);
    if (
      decoded.startsWith('//') ||
      decoded.startsWith('/\\') ||
      decoded.includes('\\')
    ) {
      return null;
    }
  } catch {
    return null;
  }

  const pathname = relative.split('?')[0]?.split('#')[0] ?? '';
  if (!pathname) {
    return null;
  }

  if (AUTH_CALLBACK_BLOCKLIST.has(pathname)) {
    return null;
  }

  if (
    pathname === Routes.Auth ||
    pathname.startsWith(`${Routes.Auth}/`) ||
    pathname.startsWith('/api/auth')
  ) {
    return null;
  }

  return relative;
}

export function isSafeRelativeCallbackPath(callbackUrl: string): boolean {
  return toSafeRelativeCallbackPath(callbackUrl) !== null;
}

export function isBlockedAuthCallbackUrl(callbackUrl: string): boolean {
  return toSafeRelativeCallbackPath(callbackUrl) === null;
}

export function getSafeAuthCallbackUrl(
  callbackUrl: string | undefined,
  fallback: string = Routes.Home
): string {
  return toSafeRelativeCallbackPath(callbackUrl) ?? fallback;
}

/**
 * Auth.js v5 `signIn(..., { redirect: false })` returns a string URL
 * (absolute or relative). Older shapes used `{ url, error }`.
 * Always return a same-origin relative app path for `window.location.assign`.
 */
export function toClientAuthRedirect(
  result: unknown,
  fallback: string
): string {
  let raw: string | undefined;

  if (typeof result === 'string' && result.trim()) {
    raw = result.trim();
  } else if (
    result &&
    typeof result === 'object' &&
    'url' in result &&
    typeof (result as { url: unknown }).url === 'string'
  ) {
    raw = (result as { url: string }).url.trim();
  }

  return getSafeAuthCallbackUrl(raw, fallback);
}
