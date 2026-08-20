import 'server-only';

import { getLogoUrl, toHostname } from '@/lib/logo';
import { extractWebsiteMetadata } from '@/lib/urls/extract-website-metadata';
import { hasLogoDevMark } from '@/lib/urls/logo-dev';
import { websiteLogoProxyUrl } from '@/lib/urls/website-logo-proxy-url';

export type ResolvedBrandAssets = {
  businessName: string;
  logoUrl: string | null;
  logoSource: 'logo.dev' | 'favicon' | 'none';
  faviconUrl: string | null;
  accentColor: string | null;
  brandColors: string[];
  canonicalUrl: string | null;
};

/**
 * logo.dev first. If it has no mark, use the site's own favicon and the
 * colors scraped from the page.
 */
export async function resolveBrandAssets(
  website: string
): Promise<ResolvedBrandAssets | null> {
  const metadata = await extractWebsiteMetadata(website);
  if (!metadata) {
    return null;
  }

  const hostname = toHostname(website);
  const logoDevOk = hostname ? await hasLogoDevMark(hostname) : false;

  if (logoDevOk && hostname) {
    return {
      businessName: metadata.businessName,
      logoUrl: getLogoUrl(hostname, 128, false),
      logoSource: 'logo.dev',
      faviconUrl: metadata.faviconUrl,
      accentColor: metadata.accentColor,
      brandColors: metadata.brandColors,
      canonicalUrl: metadata.canonicalUrl
    };
  }

  if (metadata.faviconUrl) {
    return {
      businessName: metadata.businessName,
      logoUrl: websiteLogoProxyUrl(metadata.faviconUrl),
      logoSource: 'favicon',
      faviconUrl: metadata.faviconUrl,
      accentColor: metadata.accentColor,
      brandColors: metadata.brandColors,
      canonicalUrl: metadata.canonicalUrl
    };
  }

  return {
    businessName: metadata.businessName,
    logoUrl: hostname ? getLogoUrl(hostname, 128, false) : null,
    logoSource: 'none',
    faviconUrl: null,
    accentColor: metadata.accentColor,
    brandColors: metadata.brandColors,
    canonicalUrl: metadata.canonicalUrl
  };
}
