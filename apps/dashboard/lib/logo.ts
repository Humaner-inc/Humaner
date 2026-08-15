/**
 * Builds a same-origin URL to the logo proxy (`/api/logo`). The proxy fetches
 * the brand/company logo from logo.dev server-side so the LOGO_DEV_API_KEY is
 * never exposed to the browser. Safe to call from client components.
 *
 * Set `monogram` to render a generated initials placeholder (instead of a 404)
 * when logo.dev has no logo for the domain — useful for business logos.
 */
export function getLogoUrl(
  domain: string,
  size: number = 128,
  monogram: boolean = false
): string {
  const clean = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0];
  const params = new URLSearchParams({ domain: clean, size: String(size) });
  if (monogram) {
    params.set('monogram', '1');
  }
  return `/api/logo?${params.toString()}`;
}

/** Extracts a bare hostname from a possibly-messy URL or domain string. */
export function toHostname(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }
  try {
    const url = trimmed.includes('://')
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return (
      trimmed
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0] || null
    );
  }
}

/** Best-effort business name from a website URL when the scrape fails. */
export function businessNameFromWebsite(website: string): string {
  const hostname = toHostname(website);
  if (!hostname) {
    return 'Your business';
  }
  const base = hostname.split('.')[0] ?? hostname;
  if (!base) {
    return 'Your business';
  }
  return base.charAt(0).toUpperCase() + base.slice(1);
}
