/** Same-origin proxy for a scraped favicon / site icon. */
export function websiteLogoProxyUrl(absoluteUrl: string): string {
  return `/api/website-logo?url=${encodeURIComponent(absoluteUrl)}`;
}
