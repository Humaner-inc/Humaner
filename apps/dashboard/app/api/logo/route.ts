import { type NextRequest } from 'next/server';

export const runtime = 'nodejs';

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
    return new Response(null, { status: 404 });
  }

  const cacheKey = `${domain}:${size}:${monogram ? '1' : '0'}`;

  const upstreamParams = new URLSearchParams({
    token,
    size: String(size),
    format: 'png',
    retina: 'true'
  });
  upstreamParams.set('fallback', monogram ? 'monogram' : '404');

  const logoUrl = `https://img.logo.dev/${encodeURIComponent(
    domain
  )}?${upstreamParams.toString()}`;

  // Deduplicate concurrent requests for the same logo.
  const inflight = inflightRequests.get(cacheKey);
  if (inflight) {
    const response = await inflight;
    return response.clone();
  }

  const promise = fetchLogo(cacheKey, logoUrl);
  inflightRequests.set(cacheKey, promise);

  try {
    const response = await promise;
    return response;
  } finally {
    inflightRequests.delete(cacheKey);
  }
}
