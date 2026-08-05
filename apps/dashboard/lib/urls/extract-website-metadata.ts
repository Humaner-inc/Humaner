import 'server-only';

import { toHostname } from '@/lib/logo';
import { extractBrandAccentColor } from '@/lib/urls/extract-brand-accent-color';

export type WebsiteMetadata = {
  businessName: string;
  faviconUrl: string | null;
  accentColor: string | null;
};

const FETCH_TIMEOUT_MS = 8_000;
const USER_AGENT =
  'Mozilla/5.0 (compatible; HumanerBot/1.0; +https://humaner.ai)';

function isPrivateOrLocalIpv4(host: string): boolean {
  const parts = host.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return false;
  }
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

function isPublicHttpUrl(url: URL): boolean {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return false;
  }

  const host = url.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '[::1]' ||
    host.startsWith('fc') ||
    host.startsWith('fd') ||
    host.startsWith('fe80:') ||
    host.includes(':') // block raw IPv6 literals for metadata/ULA
  ) {
    return false;
  }

  if (isPrivateOrLocalIpv4(host)) {
    return false;
  }

  return true;
}

function normalizeWebsiteUrl(value: string): URL | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = trimmed.includes('://')
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`);
    return isPublicHttpUrl(url) ? url : null;
  } catch {
    return null;
  }
}

function resolveAssetUrl(base: URL, href: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function cleanBusinessName(raw: string): string {
  let name = raw.replace(/\s+/g, ' ').trim();
  const separators = [' | ', ' - ', ' — ', ' · ', ' :: ', ' : '];

  for (const separator of separators) {
    const index = name.indexOf(separator);
    if (index > 0) {
      name = name.slice(0, index).trim();
      break;
    }
  }

  return name.slice(0, 255);
}

function businessNameFromHostname(hostname: string): string {
  const base = hostname.replace(/^www\./, '').split('.')[0] ?? hostname;
  if (!base) {
    return hostname;
  }

  return base.charAt(0).toUpperCase() + base.slice(1);
}

function readMetaContent(html: string, key: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["']`,
      'i'
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["']`,
      'i'
    ),
    new RegExp(
      `<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`,
      'i'
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["']`,
      'i'
    )
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function readTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim() ?? null;
}

function readFaviconUrl(html: string, pageUrl: URL): string | null {
  const linkTags = html.match(/<link[^>]+>/gi) ?? [];
  const candidates: Array<{ rel: string; href: string }> = [];

  for (const tag of linkTags) {
    const rel = tag.match(/rel=["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? '';
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) {
      continue;
    }

    if (
      rel.includes('apple-touch-icon') ||
      rel.includes('icon') ||
      rel.includes('shortcut icon')
    ) {
      candidates.push({ rel, href });
    }
  }

  const preferred =
    candidates.find((item) => item.rel.includes('apple-touch-icon')) ??
    candidates.find((item) => item.rel.includes('icon')) ??
    candidates[0];

  if (preferred) {
    return resolveAssetUrl(pageUrl, preferred.href);
  }

  return resolveAssetUrl(pageUrl, '/favicon.ico');
}

export async function extractWebsiteMetadata(
  website: string
): Promise<WebsiteMetadata | null> {
  const pageUrl = normalizeWebsiteUrl(website);
  if (!pageUrl) {
    return null;
  }

  const hostname = toHostname(pageUrl.toString());
  if (!hostname) {
    return null;
  }

  try {
    const response = await fetch(pageUrl.toString(), {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': USER_AGENT
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow'
    });

    if (!response.ok) {
      return {
        businessName: businessNameFromHostname(hostname),
        faviconUrl: resolveAssetUrl(pageUrl, '/favicon.ico'),
        accentColor: null
      };
    }

    const html = (await response.text()).slice(0, 250_000);
    const businessName =
      cleanBusinessName(
        readMetaContent(html, 'og:site_name') ??
          readMetaContent(html, 'application-name') ??
          readMetaContent(html, 'og:title') ??
          readTitle(html) ??
          businessNameFromHostname(hostname)
      ) || businessNameFromHostname(hostname);

    return {
      businessName,
      faviconUrl: readFaviconUrl(html, pageUrl),
      accentColor: extractBrandAccentColor(html)
    };
  } catch {
    return {
      businessName: businessNameFromHostname(hostname),
      faviconUrl: resolveAssetUrl(pageUrl, '/favicon.ico'),
      accentColor: null
    };
  }
}
