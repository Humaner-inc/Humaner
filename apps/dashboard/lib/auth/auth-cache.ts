import 'server-only';

import { getUpstashRedis } from '@/lib/redis/upstash';

/**
 * Optional short-lived Redis cache for per-request auth lookups (session +
 * user, and the workspace access context). Every authenticated request
 * otherwise costs 3-5 Neon queries.
 *
 * Off unless AUTH_CACHE_TTL_SECONDS is set (recommended 30, max 300).
 *
 * Staleness is bounded two ways:
 *  - a global epoch counter, bumped by a Prisma middleware on ANY write to
 *    Session, User or OrganizationMembership (sign-out, role, page access,
 *    workspace switch...). Entries carry the epoch they were read under and
 *    are ignored once it moves.
 *  - the TTL, as a backstop for writes that bypass the middleware.
 * Fails open: without Redis, or on any Redis error, callers hit the DB.
 */
const EPOCH_KEY = 'auth:cache:epoch';

export function authCacheTtlSeconds(): number {
  const ttl = Number(process.env.AUTH_CACHE_TTL_SECONDS);
  return Number.isFinite(ttl) && ttl > 0 ? Math.min(Math.floor(ttl), 300) : 0;
}

type Entry<T> = { e: string; v: T };

export type AuthCacheProbe<T> = {
  value: T | null;
  /** Epoch read BEFORE the DB lookup; pass back to `storeAuthCache`. */
  epoch: string | null;
};

export async function probeAuthCache<T>(
  key: string
): Promise<AuthCacheProbe<T>> {
  const redis = getUpstashRedis();
  if (!redis || authCacheTtlSeconds() === 0) {
    return { value: null, epoch: null };
  }
  try {
    const [epochRaw, entry] = await redis.mget<
      [string | number | null, Entry<T> | null]
    >(EPOCH_KEY, `auth:cache:${key}`);
    const epoch = String(epochRaw ?? '0');
    return { value: entry && entry.e === epoch ? entry.v : null, epoch };
  } catch {
    return { value: null, epoch: null };
  }
}

export async function storeAuthCache<T>(
  key: string,
  value: T,
  epoch: string | null
): Promise<void> {
  const redis = getUpstashRedis();
  const ttl = authCacheTtlSeconds();
  // No epoch means the probe failed; skipping avoids caching under a guess.
  if (!redis || ttl === 0 || epoch == null) return;
  try {
    await redis.set(`auth:cache:${key}`, { e: epoch, v: value }, { ex: ttl });
  } catch {
    // cache is best-effort
  }
}

/** Invalidate every cached auth entry. Fire and forget. */
export function bumpAuthCacheEpoch(): void {
  const redis = getUpstashRedis();
  if (!redis || authCacheTtlSeconds() === 0) return;
  void redis.incr(EPOCH_KEY).catch(() => undefined);
}
