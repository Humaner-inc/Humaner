import { DEFAULT_LOCALE } from '@/lib/i18n/locale';

const PRODUCTION_APP_URL = 'https://app.humaner.io';

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function isLocalhostUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '[::1]'
    );
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

/**
 * Public site origin for emails, invites, and absolute redirects.
 * Prefer explicit app URLs; never emit localhost links from production.
 */
function resolveBaseUrl(): string {
  const fromEnv = [
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL
  ]
    .map((value) => value?.trim())
    .find((value): value is string => Boolean(value));

  if (fromEnv) {
    const normalized = stripTrailingSlash(fromEnv);
    if (process.env.NODE_ENV === 'production' && isLocalhostUrl(normalized)) {
      console.warn(
        '[getBaseUrl] Ignoring localhost env URL in production; using app.humaner.io'
      );
      return PRODUCTION_APP_URL;
    }
    return normalized;
  }

  if (process.env.NODE_ENV === 'production') {
    const vercelProductionHost =
      process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    if (vercelProductionHost) {
      return `https://${stripTrailingSlash(vercelProductionHost)}`;
    }
    return PRODUCTION_APP_URL;
  }

  return `http://localhost:${process.env.PORT ?? 3001}`;
}

const baseUrl = resolveBaseUrl();

export function shouldAppendLocale(locale?: string | null): boolean {
  return !!locale && locale !== DEFAULT_LOCALE && locale !== 'default';
}

export function getBaseUrl(locale?: string | null): string {
  return shouldAppendLocale(locale) ? `${baseUrl}/${locale}` : baseUrl;
}
