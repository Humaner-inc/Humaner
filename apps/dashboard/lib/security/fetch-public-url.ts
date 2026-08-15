import 'server-only';

import { assertPublicHttpUrl } from '@/lib/security/public-url';

const MAX_REDIRECTS = 5;

export type FetchPublicUrlOptions = {
  timeoutMs: number;
  headers?: Record<string, string>;
  /** Restrict redirects to the same registrable host (www ↔ apex). */
  sameSiteAs?: URL;
};

export type PublicFetchResult = {
  response: Response;
  finalUrl: URL;
};

/**
 * Fetch a user-supplied URL, re-validating every redirect hop.
 *
 * `redirect: 'follow'` defeats a pre-flight SSRF check entirely: the checked
 * URL only has to be public long enough to answer with a `302` to
 * `http://169.254.169.254/`. Following redirects by hand is the only way to
 * apply the guard to the address actually connected to.
 */
export async function fetchPublicUrl(
  input: string | URL,
  options: FetchPublicUrlOptions
): Promise<PublicFetchResult> {
  let current = await assertPublicHttpUrl(input, {
    sameSiteAs: options.sameSiteAs
  });

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetch(current.toString(), {
      redirect: 'manual',
      signal: AbortSignal.timeout(options.timeoutMs),
      headers: options.headers
    });

    if (response.status < 300 || response.status >= 400) {
      return { response, finalUrl: current };
    }

    const location = response.headers.get('location');
    if (!location) {
      return { response, finalUrl: current };
    }

    current = await assertPublicHttpUrl(new URL(location, current), {
      sameSiteAs: options.sameSiteAs
    });
  }

  throw new Error('Too many redirects.');
}
