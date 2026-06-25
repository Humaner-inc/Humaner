import { type NextRequest } from 'next/server';

export const runtime = 'nodejs';

const DOMAIN_PATTERN = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
const ALLOWED_SIZES = new Set([32, 48, 64, 96, 128, 200, 256]);

/**
 * Server-side proxy for logo.dev brand logos. Keeps LOGO_DEV_API_KEY off the
 * client and lets <img src="/api/logo?domain=..."> work anywhere. Responses are
 * cached aggressively since brand logos rarely change.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain')?.trim().toLowerCase();
  const sizeParam = Number(searchParams.get('size') ?? 128);
  const size = ALLOWED_SIZES.has(sizeParam) ? sizeParam : 128;
  // When set, logo.dev returns a generated monogram instead of a 404.
  const monogram = searchParams.get('monogram') === '1';

  if (!domain || !DOMAIN_PATTERN.test(domain)) {
    return new Response(null, { status: 400 });
  }

  const token = process.env.LOGO_DEV_API_KEY;
  if (!token) {
    return new Response(null, { status: 404 });
  }

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

  try {
    const upstream = await fetch(logoUrl, {
      // Cache at the fetch layer for a day; logos are effectively static.
      next: { revalidate: 86400 }
    });

    if (!upstream.ok || !upstream.body) {
      return new Response(null, { status: 404 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'image/png',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable'
      }
    });
  } catch (error) {
    console.error('logo.dev proxy failed', error);
    return new Response(null, { status: 502 });
  }
}
