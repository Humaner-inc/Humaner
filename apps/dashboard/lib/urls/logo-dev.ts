import 'server-only';

const PROBE_TIMEOUT_MS = 4_000;

function logoDevMarkUrl(domain: string, size: number, token: string): string {
  const params = new URLSearchParams({
    token,
    size: String(size),
    format: 'png',
    retina: 'true',
    fallback: '404'
  });
  return `https://img.logo.dev/${encodeURIComponent(domain)}?${params}`;
}

/** True when logo.dev has a real brand mark (not a generated monogram). */
export async function hasLogoDevMark(
  domain: string,
  size = 128
): Promise<boolean> {
  const token = process.env.LOGO_DEV_API_KEY;
  if (!token) {
    return false;
  }

  try {
    const response = await fetch(logoDevMarkUrl(domain, size, token), {
      cache: 'no-store',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS)
    });
    return response.ok;
  } catch {
    return false;
  }
}
