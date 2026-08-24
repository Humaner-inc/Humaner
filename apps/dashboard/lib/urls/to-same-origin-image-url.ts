const APP_IMAGE_PREFIXES = [
  '/api/agent-images/',
  '/api/agent-home-banners/',
  '/api/agent-demo-backgrounds/',
  '/api/user-images/',
  '/api/contact-images/'
] as const;

/**
 * Normalize stored image URLs so same-origin API assets load from the current
 * host. Absolute URLs saved with a mismatched NEXT_PUBLIC_BASE_URL otherwise
 * show as broken images after a successful upload.
 */
export function toSameOriginImageUrl(
  url: string | null | undefined
): string | null {
  if (!url) {
    return null;
  }

  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  if (url.startsWith('/')) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (
      APP_IMAGE_PREFIXES.some((prefix) => parsed.pathname.startsWith(prefix))
    ) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // Keep the original string for non-URL values.
  }

  return url;
}
