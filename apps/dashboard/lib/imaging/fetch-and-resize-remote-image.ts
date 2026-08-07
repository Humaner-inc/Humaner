import { createHash } from 'crypto';

import { resizeImage } from '@/lib/imaging/resize-image';
import { getBaseUrl } from '@/lib/urls/get-base-url';
import { isPublicHttpUrl } from '@/lib/urls/is-public-http-url';

type ResizedImage = {
  bytes?: Buffer;
  contentType?: string;
  hash?: string;
};

function guessMimeType(url: string, headerValue: string | null): string | null {
  const fromHeader = headerValue?.split(';')[0]?.trim().toLowerCase();
  if (fromHeader?.startsWith('image/')) {
    return fromHeader;
  }

  const path = (() => {
    try {
      return new URL(url).pathname.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  })();

  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.gif')) return 'image/gif';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (
    path.includes('googleusercontent.com') ||
    path.includes('githubusercontent.com')
  ) {
    return 'image/jpeg';
  }

  return null;
}

export async function fetchAndResizeRemoteImage(
  url?: string
): Promise<ResizedImage> {
  let bytes: Buffer | undefined;
  let contentType: string | undefined;
  let hash: string | undefined;

  if (url) {
    try {
      const remote = new URL(url);
      const appOrigin = new URL(getBaseUrl()).origin;
      if (remote.origin === appOrigin) {
        return { bytes, contentType, hash };
      }
      if (!isPublicHttpUrl(remote)) {
        console.warn(
          '[fetchAndResizeRemoteImage] blocked non-public avatar URL'
        );
        return { bytes, contentType, hash };
      }

      const response = await fetch(remote.toString(), {
        headers: {
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'User-Agent': 'HumanerAvatarBot/1.0'
        },
        redirect: 'follow'
      });
      if (response.ok) {
        // Re-check the final URL after redirects (SSRF via redirect target).
        try {
          if (!isPublicHttpUrl(new URL(response.url))) {
            console.warn(
              '[fetchAndResizeRemoteImage] blocked redirect to non-public URL'
            );
            return { bytes, contentType, hash };
          }
        } catch {
          return { bytes, contentType, hash };
        }

        const mimeType = guessMimeType(
          response.url || url,
          response.headers.get('content-type')
        );
        if (mimeType) {
          const jsBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(new Uint8Array(jsBuffer));
          bytes = await resizeImage(buffer, mimeType);
          if (bytes) {
            contentType = mimeType;
            hash = createHash('sha256').update(bytes).digest('hex');
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  return {
    bytes,
    contentType,
    hash
  };
}
