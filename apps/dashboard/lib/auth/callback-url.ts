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

function getCallbackPathname(callbackUrl: string): string | null {
  try {
    if (
      callbackUrl.startsWith('http://') ||
      callbackUrl.startsWith('https://')
    ) {
      return new URL(callbackUrl).pathname;
    }

    return callbackUrl.split('?')[0]?.split('#')[0] ?? null;
  } catch {
    return null;
  }
}

export function isBlockedAuthCallbackUrl(callbackUrl: string): boolean {
  const pathname = getCallbackPathname(callbackUrl);
  if (!pathname) {
    return true;
  }

  if (AUTH_CALLBACK_BLOCKLIST.has(pathname)) {
    return true;
  }

  return pathname.startsWith(`${Routes.Auth}/`);
}

export function getSafeAuthCallbackUrl(
  callbackUrl: string | undefined,
  fallback: string = Routes.Home
): string {
  if (!callbackUrl || isBlockedAuthCallbackUrl(callbackUrl)) {
    return fallback;
  }

  return callbackUrl;
}

/**
 * Auth.js v5 `signIn(..., { redirect: false })` returns a string URL
 * (absolute or relative). Older shapes used `{ url, error }`.
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

  if (!raw) {
    return fallback;
  }

  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      const url = new URL(raw);
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return fallback;
  }

  if (raw.startsWith('/')) {
    return raw;
  }

  return fallback;
}
