import 'server-only';

import { assertPublicHttpUrl } from '@/lib/security/public-url';

const MAX_REDIRECTS = 5;

export type FetchPublicUrlOptions = {
  timeoutMs: number;
  headers?: Record<string, string>;
  // Restrict redirects (www ↔ apex).
  sameSiteAs?: URL;
};

export type PublicFetchResult = {
  response: Response;
  finalUrl: URL;
};

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
