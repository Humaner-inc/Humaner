import 'server-only';

import { getLogoUrl, toHostname } from '@/lib/logo';
import { toSameOriginImageUrl } from '@/lib/urls/to-same-origin-image-url';

const RELIABLE_SAME_ORIGIN_PREFIXES = [
  '/api/logo',
  '/api/website-logo',
  '/api/agent-images/',
  '/api/agent-home-banners/',
  '/api/user-images/',
  '/api/contact-images/',
  '/personas/'
] as const;

/**
 * Scraped favicons and other third-party image hosts often break in embeds
 * (hotlink blocks, 404s, wrong content-type). Only trust same-origin assets
 * and data URIs; otherwise use the logo.dev proxy.
 */
function isReliableLogoUrl(url: string): boolean {
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return true;
  }

  const normalized = toSameOriginImageUrl(url) ?? url;
  if (!normalized.startsWith('/')) {
    return false;
  }

  return RELIABLE_SAME_ORIGIN_PREFIXES.some((prefix) =>
    normalized.startsWith(prefix)
  );
}

/**
 * Resolves a business logo URL for display.
 *
 * Prefers a reliable stored logo (same-origin upload / logo proxy), then falls
 * back to logo.dev via `/api/logo`. External scraped favicons are skipped —
 * they frequently render as broken images inside the chat widget iframe.
 */
export function getBusinessLogoUrl(
  website: string | null | undefined,
  options?: { size?: number; logoUrl?: string | null }
): string | null {
  const size = options?.size ?? 128;
  const stored = options?.logoUrl?.trim();

  if (stored) {
    const sameOrigin = toSameOriginImageUrl(stored) ?? stored;
    if (isReliableLogoUrl(sameOrigin)) {
      return sameOrigin;
    }
  }

  const domain = website ? toHostname(website) : null;
  if (domain) {
    return getLogoUrl(domain, size, true);
  }

  if (stored) {
    return toSameOriginImageUrl(stored) ?? stored;
  }

  return null;
}
