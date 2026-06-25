import 'server-only';

import { getLogoUrl, toHostname } from '@/lib/logo';

/**
 * Resolves a business logo URL for display.
 *
 * Prefers a stored favicon/logo URL (from onboarding), then falls back to
 * logo.dev via the same-origin `/api/logo` proxy.
 */
export function getBusinessLogoUrl(
  website: string | null | undefined,
  options?: { size?: number; logoUrl?: string | null }
): string | null {
  if (options?.logoUrl) {
    return options.logoUrl;
  }

  const size = options?.size ?? 128;
  const token = process.env.LOGO_DEV_API_KEY ?? process.env.NEXT_LOGO_API_KEY;
  if (!website || !token) {
    return null;
  }

  const domain = toHostname(website);
  if (!domain) {
    return null;
  }

  return getLogoUrl(domain, size, true);
}
