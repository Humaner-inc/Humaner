import 'server-only';

import { toHostname } from '@/lib/logo';
import { fetchPublicUrl } from '@/lib/security/fetch-public-url';
import {
  extractBrandAccentColor,
  extractBrandColorPalette
} from '@/lib/urls/extract-brand-accent-color';
import { parsePublicHttpUrl } from '@/lib/urls/is-public-http-url';

export type WebsiteMetadata = {
  businessName: string;
  faviconUrl: string | null;
  accentColor: string | null;
  /** Usable brand swatches scraped with the logo (theme-color, CSS vars, …). */
  brandColors: string[];
};

const FETCH_TIMEOUT_MS = 8_000;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function normalizeWebsiteUrl(value: string): URL | null {
  return parsePublicHttpUrl(value);
}

function resolveAssetUrl(base: URL, href: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCodePoint(Number.parseInt(dec, 10))
    )
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function cleanBusinessName(raw: string): string {
  let name = decodeHtmlEntities(raw).replace(/\s+/g, ' ').trim();
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

function parseIconSize(sizes: string | undefined): number {
  if (!sizes || sizes === 'any') {
    return 0;
  }
  const match = sizes.match(/(\d+)x(\d+)/i);
  if (!match) {
    return 0;
  }
  return Math.max(Number(match[1]), Number(match[2]));
}

function scoreIconCandidate(input: {
  rel: string;
  href: string;
  type?: string;
  sizes?: string;
}): number {
  let score = 0;
  const href = input.href.toLowerCase();
  const type = input.type?.toLowerCase() ?? '';
  const size = parseIconSize(input.sizes);

  if (input.rel.includes('apple-touch-icon')) score += 40;
  if (href.endsWith('.svg') || type.includes('svg')) score += 35;
  if (href.endsWith('.png') || type.includes('png')) score += 25;
  if (href.endsWith('.webp') || type.includes('webp')) score += 20;
  if (href.endsWith('.ico') || type.includes('icon')) score += 5;
  score += Math.min(size, 512) / 8;
  return score;
}

function readFaviconUrl(html: string, pageUrl: URL): string | null {
  const linkTags = html.match(/<link[^>]+>/gi) ?? [];
  const candidates: Array<{
    rel: string;
    href: string;
    type?: string;
    sizes?: string;
    score: number;
  }> = [];

  for (const tag of linkTags) {
    const rel = tag.match(/rel=["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? '';
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) {
      continue;
    }

    if (
      !(
        rel.includes('apple-touch-icon') ||
        rel.includes('icon') ||
        rel.includes('shortcut icon')
      )
    ) {
      continue;
    }

    const type = tag.match(/type=["']([^"']+)["']/i)?.[1];
    const sizes = tag.match(/sizes=["']([^"']+)["']/i)?.[1];
    candidates.push({
      rel,
      href,
      type,
      sizes,
      score: scoreIconCandidate({ rel, href, type, sizes })
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  const preferred = candidates[0];
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
    const { response, finalUrl } = await fetchPublicUrl(pageUrl, {
      timeoutMs: FETCH_TIMEOUT_MS,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': USER_AGENT
      }
    });

    if (!response.ok) {
      return {
        businessName: businessNameFromHostname(hostname),
        faviconUrl: resolveAssetUrl(finalUrl, '/favicon.ico'),
        accentColor: null,
        brandColors: []
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

    const brandColors = extractBrandColorPalette(html);
    const accentColor = extractBrandAccentColor(html) ?? brandColors[0] ?? null;

    return {
      businessName,
      faviconUrl: readFaviconUrl(html, finalUrl),
      accentColor,
      brandColors
    };
  } catch {
    return {
      businessName: businessNameFromHostname(hostname),
      faviconUrl: resolveAssetUrl(pageUrl, '/favicon.ico'),
      accentColor: null,
      brandColors: []
    };
  }
}
