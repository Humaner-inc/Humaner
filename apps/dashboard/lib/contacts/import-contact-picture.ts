import 'server-only';

import { createHash } from 'crypto';

import { fetchAndResizeRemoteImage } from '@/lib/imaging/fetch-and-resize-remote-image';

type ImportedPicture = {
  bytes: Buffer;
  contentType: string;
  hash: string;
};

function gravatarUrl(email: string): string {
  const hash = createHash('md5')
    .update(email.trim().toLowerCase())
    .digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=256&d=404&r=g`;
}

function unavatarUrl(email: string): string {
  return `https://unavatar.io/${encodeURIComponent(email)}?fallback=false`;
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  const result = await Promise.race([promise, timeout]);
  if (timer) clearTimeout(timer);
  return result;
}

/**
 * Pull a public picture keyed by the email address (Gravatar, then Unavatar).
 * Returns null when neither source has a photo.
 */
export async function importContactPictureFromEmail(
  email: string
): Promise<ImportedPicture | null> {
  const [gravatar, unavatar] = await Promise.all([
    withTimeout(fetchAndResizeRemoteImage(gravatarUrl(email)), 4000),
    withTimeout(fetchAndResizeRemoteImage(unavatarUrl(email)), 4000)
  ]);

  const picture = gravatar?.bytes
    ? gravatar
    : unavatar?.bytes
      ? unavatar
      : null;
  if (!picture?.bytes || !picture.contentType || !picture.hash) return null;

  return {
    bytes: picture.bytes,
    contentType: picture.contentType,
    hash: picture.hash
  };
}
