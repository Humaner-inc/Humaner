'use client';

export type HubGrant = { url: string; token: string };

let cached: { grant: HubGrant; expiresAt: number } | null = null;
let noHubUntil = 0;
let inflight: Promise<HubGrant | null> | null = null;

/**
 * Short-lived token + URL for the realtime hub, shared by the event stream and
 * presence heartbeats. Null when no hub is configured (callers fall back to the
 * serverless routes). Cached until shortly before expiry.
 */
export async function getHubGrant(
  signal?: AbortSignal
): Promise<HubGrant | null> {
  const now = Date.now();
  if (now < noHubUntil) return null;
  if (cached && cached.expiresAt - 30_000 > now) return cached.grant;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const response = await fetch('/api/dashboard/realtime/token', {
        signal,
        cache: 'no-store'
      });
      if (!response.ok) return null;
      const data = (await response.json()) as {
        url?: string | null;
        token?: string;
        expiresAt?: number;
      };
      if (data.url && data.token && data.expiresAt) {
        cached = {
          grant: { url: data.url, token: data.token },
          expiresAt: data.expiresAt
        };
        return cached.grant;
      }
      noHubUntil = Date.now() + 10 * 60_000;
      return null;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Drop the cached token (e.g. after a 401 from the hub). */
export function resetHubGrant(): void {
  cached = null;
}
