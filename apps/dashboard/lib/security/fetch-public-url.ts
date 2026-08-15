import 'server-only';

import http from 'node:http';
import https from 'node:https';

import { assertPublicHttpUrl } from '@/lib/security/public-url';

const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 2_500_000;

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

/**
 * GET a user-supplied URL and re-validate every redirect hop.
 *
 * Uses Node `http`/`https` instead of global `fetch`. Next.js 15 patches
 * `fetch` and treats HTTP 308 as an internal App Router redirect, so
 * `redirect: 'manual'` hangs or drops `Location` on real sites (apex → www).
 */
function requestOnce(
  url: URL,
  options: { timeoutMs: number; headers?: Record<string, string> }
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || undefined,
        path: `${url.pathname}${url.search}`,
        method: 'GET',
        timeout: options.timeoutMs,
        headers: options.headers
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const headers = new Headers();
        for (const [key, value] of Object.entries(res.headers)) {
          if (value === undefined) {
            continue;
          }
          if (Array.isArray(value)) {
            for (const item of value) {
              headers.append(key, item);
            }
          } else {
            headers.set(key, value);
          }
        }

        if (status >= 300 && status < 400) {
          res.resume();
          resolve(new Response(null, { status, headers }));
          return;
        }

        const chunks: Buffer[] = [];
        let total = 0;
        res.on('data', (chunk: Buffer) => {
          total += chunk.byteLength;
          if (total > MAX_BODY_BYTES) {
            req.destroy();
            reject(new Error('Response too large.'));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => {
          resolve(
            new Response(Buffer.concat(chunks), {
              status,
              statusText: res.statusMessage ?? '',
              headers
            })
          );
        });
        res.on('error', reject);
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out.'));
    });
    req.end();
  });
}

export async function fetchPublicUrl(
  input: string | URL,
  options: FetchPublicUrlOptions
): Promise<PublicFetchResult> {
  let current = await assertPublicHttpUrl(input, {
    sameSiteAs: options.sameSiteAs
  });

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await requestOnce(current, {
      timeoutMs: options.timeoutMs,
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
