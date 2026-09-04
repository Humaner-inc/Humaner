import 'server-only';

/**
 * Self-Host (OSS) twin of `lib/redis/upstash.ts`.
 *
 * Cloud uses Upstash Redis so that many serverless instances share one cache,
 * lock namespace, and rate-limit counter. Self-Host runs as a single long-lived
 * Node process (`next start`), so the correct backing store is process memory —
 * no external service, no `@upstash/redis` dependency. The exported surface is
 * identical to the Cloud module; josh renames this file onto `upstash.ts`.
 *
 * Trade-off: state is per-process. Running multiple replicas behind a load
 * balancer means each replica keeps its own cache/counters. That is fine for the
 * cache (it self-heals from Postgres) and acceptable for coarse rate limits; put
 * a shared store or a WAF limit in front only if you scale horizontally.
 */

type Entry = { value: unknown; expiresAt: number };

const MAX_KEYS = 10_000;
const store = new Map<string, Entry>();
const counters = new Map<string, { count: number; resetAt: number }>();

function evictOverflow(): void {
  while (store.size > MAX_KEYS) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

/** No raw client in Self-Host. Callers must treat `null` as "no shared store". */
export function getUpstashRedis(): null {
  return null;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  store.delete(key);
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1_000 });
  evictOverflow();
}

export async function cacheDelete(key: string): Promise<void> {
  store.delete(key);
}

export async function acquireLock(
  key: string,
  ttlSeconds: number
): Promise<(() => Promise<void>) | null> {
  const now = Date.now();
  const lockKey = `lock:${key}`;
  const existing = counters.get(lockKey);
  if (existing && existing.resetAt > now) {
    return null;
  }
  counters.set(lockKey, { count: 1, resetAt: now + ttlSeconds * 1_000 });
  return async () => {
    counters.delete(lockKey);
  };
}

export async function incrementRateLimit(
  key: string,
  windowSeconds: number
): Promise<number> {
  const now = Date.now();
  const entry = counters.get(key);
  if (!entry || entry.resetAt <= now) {
    counters.set(key, { count: 1, resetAt: now + windowSeconds * 1_000 });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}
