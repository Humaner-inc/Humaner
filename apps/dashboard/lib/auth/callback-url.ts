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

const MFA_CHALLENGE_PATHS = new Set<string>([Routes.Totp, Routes.RecoveryCode]);

/**
 * Normalize to a same-origin relative path, or null.
 * Does not apply the auth callback blocklist.
 */
function toRelativePath(callbackUrl: string | undefined | null): string | null {
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

  return relative;
}

/**
 * Auth.js signIn callbacks intentionally return MFA challenge URLs
 * (`/auth/totp` / `/auth/recovery-code` with token + expiry). Those must be
 * honored by the client even though they are blocked as post-login callbacks.
 */
export function toMfaChallengeRedirect(
  callbackUrl: string | undefined | null
): string | null {
  const relative = toRelativePath(callbackUrl);
  if (!relative) {
    return null;
  }

  const pathname = relative.split('?')[0]?.split('#')[0] ?? '';
  if (!MFA_CHALLENGE_PATHS.has(pathname)) {
    return null;
  }

  const search = relative.includes('?')
    ? relative.slice(relative.indexOf('?') + 1).split('#')[0]
    : '';
  const params = new URLSearchParams(search);
  if (!params.get('token')?.trim() || !params.get('expiry')?.trim()) {
    return null;
  }

  return relative;
}

/**
 * Normalize any callback to same-origin relative path, or null.
 * Rejects protocol-relative (`//evil.com`), auth routes, and `/api/auth/*`
 */
export function toSafeRelativeCallbackPath(
  callbackUrl: string | undefined | null
): string | null {
  const relative = toRelativePath(callbackUrl);
  if (!relative) {
    return null;
  }

  const pathname = relative.split('?')[0]?.split('#')[0] ?? '';

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

function extractSignInResultUrl(result: unknown): string | undefined {
  if (typeof result === 'string' && result.trim()) {
    return result.trim();
  }
  if (
    result &&
    typeof result === 'object' &&
    'url' in result &&
    typeof (result as { url: unknown }).url === 'string'
  ) {
    const url = (result as { url: string }).url.trim();
    return url || undefined;
  }
  return undefined;
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
  const raw = extractSignInResultUrl(result);
  return toMfaChallengeRedirect(raw) ?? getSafeAuthCallbackUrl(raw, fallback);
}

function isTrustedOAuthAuthorizationHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === 'accounts.google.com' ||
    host.endsWith('.google.com') ||
    host === 'github.com' ||
    host === 'www.github.com'
  );
}

/**
 * OAuth `signIn(..., { redirect: false })` returns the provider authorize URL
 * (or a same-origin `/api/auth/*` hop). Unlike post-login redirects, these must
 * stay absolute when they point at Google/GitHub.
 */
export function toOAuthSignInRedirect(
  result: unknown,
  fallback: string
): string {
  const raw = extractSignInResultUrl(result);
  if (!raw) {
    return fallback;
  }

  if (raw.startsWith('/api/auth')) {
    return raw;
  }

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const url = new URL(raw);
      if (isTrustedOAuthAuthorizationHost(url.hostname)) {
        return url.toString();
      }
      // Same-app absolute URL (e.g. https://app.humaner.io/api/auth/signin/…)
      const pathname = `${url.pathname}${url.search}${url.hash}`;
      if (pathname.startsWith('/api/auth')) {
        return pathname;
      }
      return (
        toMfaChallengeRedirect(pathname) ??
        getSafeAuthCallbackUrl(pathname, fallback)
      );
    } catch {
      return fallback;
    }
  }

  return toMfaChallengeRedirect(raw) ?? getSafeAuthCallbackUrl(raw, fallback);
}
