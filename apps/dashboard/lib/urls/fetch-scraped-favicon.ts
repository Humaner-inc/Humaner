import 'server-only';

import { fetchPublicUrl } from '@/lib/security/fetch-public-url';
import { extractWebsiteMetadata } from '@/lib/urls/extract-website-metadata';
import { parsePublicHttpUrl } from '@/lib/urls/is-public-http-url';

const FETCH_TIMEOUT_MS = 8_000;
const MAX_BYTES = 1_500_000;

function isImageContentType(value: string | null): boolean {
  if (!value) {
    return false;
  }
  const type = value.split(';')[0]?.trim().toLowerCase() ?? '';
  return (
    type.startsWith('image/') ||
    type === 'application/octet-stream' ||
    type === 'application/ico'
  );
}

function contentTypeFromUrl(url: string, header: string | null): string {
  const fromHeader = header?.split(';')[0]?.trim();
  if (fromHeader && fromHeader !== 'application/octet-stream') {
    return fromHeader;
  }

  const path = url.toLowerCase();
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.gif')) return 'image/gif';
  if (path.endsWith('.ico')) return 'image/x-icon';
  return fromHeader || 'image/png';
}

/**
 * Fetch the site's own favicon / apple-touch-icon after logo.dev has no mark.
 */
export async function fetchScrapedFavicon(website: string): Promise<{
  buffer: ArrayBuffer;
  contentType: string;
  faviconUrl: string;
} | null> {
  const metadata = await extractWebsiteMetadata(website);
  const faviconUrl = metadata?.faviconUrl?.trim();
  if (!faviconUrl) {
    return null;
  }

  const target = parsePublicHttpUrl(faviconUrl);
  if (!target) {
    return null;
  }

  try {
    const { response } = await fetchPublicUrl(target, {
      timeoutMs: FETCH_TIMEOUT_MS,
      headers: {
        Accept: 'image/*,*/*;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (compatible; HumanerBot/1.0; +https://humaner.ai)'
      }
    });

    if (!response.ok) {
      return null;
    }

    const headerType = response.headers.get('content-type');
    if (headerType && !isImageContentType(headerType)) {
      return null;
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_BYTES) {
      return null;
    }

    return {
      buffer,
      contentType: contentTypeFromUrl(target.toString(), headerType),
      faviconUrl
    };
  } catch (error) {
    console.error('[fetchScrapedFavicon] failed', { website, error });
    return null;
  }
}
