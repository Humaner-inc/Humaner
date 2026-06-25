import { createHash } from 'crypto';

import { resizeImage } from '@/lib/imaging/resize-image';
import { getBaseUrl } from '@/lib/urls/get-base-url';

type ResizedImage = {
  bytes?: Buffer;
  contentType?: string;
  hash?: string;
};

export async function fetchAndResizeRemoteImage(
  url?: string
): Promise<ResizedImage> {
  let bytes: Buffer | undefined;
  let contentType: string | undefined;
  let hash: string | undefined;

  if (url) {
    try {
      if (new URL(url).origin !== new URL(getBaseUrl()).origin) {
        const response = await fetch(url);
        if (response.ok) {
          const mimeType = response.headers.get('content-type');
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
