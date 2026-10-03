import { type NextRequest } from 'next/server';

import { fetchScrapedFavicon } from '@/lib/urls/fetch-scraped-favicon';

const DOMAIN_PATTERN = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
const ALLOWED_SIZES = new Set([32, 48, 64, 72, 96, 128, 200, 256]);

/**
 * In-memory cache for logo responses. Logos are static brand assets — once
 * fetched they never change. This avoids hammering logo.dev on every inbox
 * mount and eliminates the 300-3500 ms round-trip for repeat visits.
 */
const LOGO_CACHE = new Map<
  string,
  { buffer: ArrayBuffer; contentType: string; ts: number }
>();
const MAX_CACHE_SIZE = 500;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Prevent duplicate in-flight requests to the same logo. */
const inflightRequests = new Map<string, Promise<Response>>();

function evictStale(): void {
  if (LOGO_CACHE.size <= MAX_CACHE_SIZE) return;
  const now = Date.now();
  for (const [key, entry] of LOGO_CACHE) {
    if (now - entry.ts > CACHE_TTL_MS || LOGO_CACHE.size > MAX_CACHE_SIZE) {
      LOGO_CACHE.delete(key);
    }
  }
}

function domainMonogramSvg(domain: string, size: number): Response {
  const letter = (
    domain.replace(/^www\./, '').match(/[a-z0-9]/i)?.[0] ?? '?'
  ).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128"><rect width="128" height="128" fill="#0A0D0D"/><text x="64" y="82" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="64" font-weight="600" fill="#f2f2f2">${letter}</text></svg>`;
  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control':
        'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      'X-Logo-Cache': 'MONOGRAM'
    }
  });
}

function logoDevUrl(
  domain: string,
  size: number,
  token: string,
  monogram: boolean
): string {
  const upstreamParams = new URLSearchParams({
    token,
    size: String(size),
    format: 'png',
    retina: 'true',
    fallback: monogram ? 'monogram' : '404'
  });
  return `https://img.logo.dev/${encodeURIComponent(domain)}?${upstreamParams}`;
}

async function fetchLogo(cacheKey: string, logoUrl: string): Promise<Response> {
  const cached = LOGO_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return new Response(cached.buffer, {
      status: 200,
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control':
          'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400, immutable',
        'X-Logo-Cache': 'HIT'
      }
    });
  }

  try {
    const upstream = await fetch(logoUrl, {
      next: { revalidate: 86400 }
    });

    if (!upstream.ok || !upstream.body) {
      return new Response(null, { status: 404 });
    }

    const buffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('content-type') ?? 'image/png';

    evictStale();
    LOGO_CACHE.set(cacheKey, { buffer, contentType, ts: Date.now() });

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control':
          'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400, immutable',
        'X-Logo-Cache': 'MISS'
      }
    });
  } catch (error) {
    console.error('logo.dev proxy failed', error);
    return new Response(null, { status: 502 });
  }
}

/**
 * Server-side proxy for logo.dev brand logos. Keeps LOGO_DEV_API_KEY off the
 * client and lets <img src="/api/logo?domain=..."> work anywhere. Responses are
 * cached aggressively (in-memory + CDN headers) since brand logos rarely change.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain')?.trim().toLowerCase();
  const sizeParam = Number(searchParams.get('size') ?? 128);
  const size = ALLOWED_SIZES.has(sizeParam) ? sizeParam : 128;
  const monogram = searchParams.get('monogram') === '1';

  if (!domain || !DOMAIN_PATTERN.test(domain)) {
    return new Response(null, { status: 400 });
  }

  const token = process.env.LOGO_DEV_API_KEY;
  if (!token) {
    const scraped = await cachedScrapedFavicon(domain, size);
    return scraped ?? domainMonogramSvg(domain, size);
  }

  const cacheKey = `${domain}:${size}:${monogram ? '1' : '0'}`;

  const inflight = inflightRequests.get(cacheKey);
  if (inflight) {
    const response = await inflight;
    return response.clone();
  }

  const promise = (async () => {
    const markKey = `${domain}:${size}:mark`;
    const primary = await fetchLogo(
      markKey,
      logoDevUrl(domain, size, token, false)
    );
    if (primary.ok) {
      return primary;
    }

    const scraped = await cachedScrapedFavicon(domain, size);
    if (scraped) {
      return scraped;
    }

    if (monogram) {
      const monogramKey = `${domain}:${size}:1`;
      return fetchLogo(monogramKey, logoDevUrl(domain, size, token, true));
    }

    return domainMonogramSvg(domain, size);
  })();

  inflightRequests.set(cacheKey, promise);

  try {
    const response = await promise;
    if (response.ok) {
      return response;
    }
    return domainMonogramSvg(domain, size);
  } finally {
    inflightRequests.delete(cacheKey);
  }
}

async function cachedScrapedFavicon(
  domain: string,
  size: number
): Promise<Response | null> {
  const cacheKey = `${domain}:${size}:favicon`;
  const cached = LOGO_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return new Response(cached.buffer, {
      status: 200,
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control':
          'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
        'X-Logo-Cache': 'FAVICON'
      }
    });
  }

  const scraped = await fetchScrapedFavicon(`https://${domain}`);
  if (!scraped) {
    return null;
  }

  evictStale();
  LOGO_CACHE.set(cacheKey, {
    buffer: scraped.buffer,
    contentType: scraped.contentType,
    ts: Date.now()
  });

  return new Response(scraped.buffer, {
    status: 200,
    headers: {
      'Content-Type': scraped.contentType,
      'Cache-Control':
        'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      'X-Logo-Cache': 'FAVICON'
    }
  });
}
