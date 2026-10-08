import 'server-only';

import { rateLimit } from '@/lib/network/rate-limit';
import { incrementRateLimit } from '@/lib/redis/upstash';

const WINDOW_SECONDS = 60;

const DEFAULT_CREDENTIAL_PER_MINUTE = 300;
const DEFAULT_IP_PER_MINUTE = 600;
const DEFAULT_FAILED_AUTH_PER_MINUTE = 30;

export type ApiRateLimitResult =
  | { limited: false }
  | { limited: true; retryAfterSeconds: number };

function readLimit(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Fixed-window counter. Uses the shared store when one is configured and falls
 * back to process memory otherwise, so the limit is never silently off.
 */
async function hit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<ApiRateLimitResult> {
  let count = 0;
  try {
    count = await incrementRateLimit(key, windowSeconds);
  } catch {
    count = 0;
  }

  const limited =
    count > 0
      ? count > limit
      : // memory-cache helper limits at usage >= limit; allow exactly `limit`.
        rateLimit({ intervalInMs: windowSeconds * 1_000 }).check(limit + 1, key)
          .isRateLimited;

  return limited
    ? { limited: true, retryAfterSeconds: windowSeconds }
    : { limited: false };
}

/** Every request from one address, authenticated or not. */
export function checkIpRateLimit(ip: string): Promise<ApiRateLimitResult> {
  return hit(
    `api:ip:${ip}`,
    readLimit('API_RATE_LIMIT_IP_PER_MINUTE', DEFAULT_IP_PER_MINUTE),
    WINDOW_SECONDS
  );
}

/** Authenticated traffic for one API key or OAuth grant. */
export function checkCredentialRateLimit(
  credentialId: string
): Promise<ApiRateLimitResult> {
  return hit(
    `api:cred:${credentialId}`,
    readLimit('API_RATE_LIMIT_PER_MINUTE', DEFAULT_CREDENTIAL_PER_MINUTE),
    WINDOW_SECONDS
  );
}

/** Counts a rejected credential. Throttles guessing from one address. */
export function recordFailedAuth(ip: string): Promise<ApiRateLimitResult> {
  return hit(
    `api:fail:${ip}`,
    readLimit(
      'API_RATE_LIMIT_FAILED_AUTH_PER_MINUTE',
      DEFAULT_FAILED_AUTH_PER_MINUTE
    ),
    WINDOW_SECONDS
  );
}

/** Generic named bucket for public endpoints (OAuth registration, token). */
export function checkBucketRateLimit(input: {
  bucket: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
}): Promise<ApiRateLimitResult> {
  return hit(
    `api:${input.bucket}:${input.identifier}`,
    input.limit,
    input.windowSeconds
  );
}

export function rateLimitedHeaders(
  retryAfterSeconds: number
): Record<string, string> {
  return { 'Retry-After': String(retryAfterSeconds) };
}
