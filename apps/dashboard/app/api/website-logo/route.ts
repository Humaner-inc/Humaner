import { type NextRequest } from 'next/server';

import { fetchPublicUrl } from '@/lib/security/fetch-public-url';
import { parsePublicHttpUrl } from '@/lib/urls/is-public-http-url';

const FETCH_TIMEOUT_MS = 8_000;
const MAX_BYTES = 1_500_000;
const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'image/ico'
]);

const CACHE = new Map<
  string,
  { buffer: ArrayBuffer; contentType: string; ts: number }
>();
const MAX_CACHE_SIZE = 200;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function evictStale(): void {
  if (CACHE.size <= MAX_CACHE_SIZE) return;
  const now = Date.now();
  for (const [key, entry] of CACHE) {
    if (now - entry.ts > CACHE_TTL_MS || CACHE.size > MAX_CACHE_SIZE) {
      CACHE.delete(key);
    }
  }
}

function isAllowedContentType(value: string | null): boolean {
  if (!value) return false;
  const type = value.split(';')[0]?.trim().toLowerCase() ?? '';
  return ALLOWED_TYPES.has(type) || type.startsWith('image/');
}

/**
 * Same-origin proxy for scraped website logos/favicons. External hosts often
 * block hotlinking inside the widget iframe; this keeps onboarding marks
 * reliable for dashboard + embed use.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const raw = request.nextUrl.searchParams.get('url')?.trim();
  if (!raw) {
    return new Response(null, { status: 400 });
  }

  const target = parsePublicHttpUrl(raw);
  if (!target) {
    return new Response(null, { status: 400 });
  }

  const cacheKey = target.toString();
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return new Response(cached.buffer, {
      status: 200,
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control':
          'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
        'X-Website-Logo-Cache': 'HIT'
      }
    });
  }

  try {
    const { response: upstream } = await fetchPublicUrl(target, {
      timeoutMs: FETCH_TIMEOUT_MS,
      headers: {
        Accept: 'image/*,*/*;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (compatible; HumanerBot/1.0; +https://humaner.ai)'
      }
    });

    if (!upstream.ok) {
      return new Response(null, { status: 404 });
    }

    const contentType =
      upstream.headers.get('content-type')?.split(';')[0]?.trim() ??
      'image/png';
    if (!isAllowedContentType(contentType)) {
      return new Response(null, { status: 415 });
    }

    const buffer = await upstream.arrayBuffer();
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_BYTES) {
      return new Response(null, { status: 404 });
    }

    evictStale();
    CACHE.set(cacheKey, { buffer, contentType, ts: Date.now() });

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control':
          'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
        'X-Website-Logo-Cache': 'MISS'
      }
    });
  } catch (error) {
    console.error('[website-logo] proxy failed', error);
    return new Response(null, { status: 502 });
  }
}
