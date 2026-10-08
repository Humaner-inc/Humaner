import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  checkBucketRateLimit,
  checkCredentialRateLimit,
  checkIpRateLimit,
  rateLimitedHeaders,
  recordFailedAuth
} from '@/lib/security/api-rate-limit';

const incrementRateLimit =
  vi.fn<(key: string, window: number) => Promise<number>>();

vi.mock('@/lib/redis/upstash', () => ({
  incrementRateLimit: (key: string, window: number) =>
    incrementRateLimit(key, window)
}));

describe('api rate limit', () => {
  beforeEach(() => {
    incrementRateLimit.mockReset();
  });

  afterEach(() => {
    delete process.env.API_RATE_LIMIT_PER_MINUTE;
    delete process.env.API_RATE_LIMIT_FAILED_AUTH_PER_MINUTE;
  });

  it('allows traffic under the credential limit', async () => {
    incrementRateLimit.mockResolvedValue(300);
    expect(await checkCredentialRateLimit('key_1')).toEqual({ limited: false });
    expect(incrementRateLimit).toHaveBeenCalledWith('api:cred:key_1', 60);
  });

  it('limits traffic over the credential limit with a retry hint', async () => {
    incrementRateLimit.mockResolvedValue(301);
    expect(await checkCredentialRateLimit('key_1')).toEqual({
      limited: true,
      retryAfterSeconds: 60
    });
  });

  it('honors API_RATE_LIMIT_PER_MINUTE', async () => {
    process.env.API_RATE_LIMIT_PER_MINUTE = '5';
    incrementRateLimit.mockResolvedValue(6);
    expect((await checkCredentialRateLimit('key_1')).limited).toBe(true);
    incrementRateLimit.mockResolvedValue(5);
    expect((await checkCredentialRateLimit('key_1')).limited).toBe(false);
  });

  it('ignores invalid limit values and keeps the default', async () => {
    process.env.API_RATE_LIMIT_PER_MINUTE = '0';
    incrementRateLimit.mockResolvedValue(301);
    expect((await checkCredentialRateLimit('key_1')).limited).toBe(true);
    process.env.API_RATE_LIMIT_PER_MINUTE = 'abc';
    incrementRateLimit.mockResolvedValue(300);
    expect((await checkCredentialRateLimit('key_1')).limited).toBe(false);
  });

  it('throttles repeated rejected credentials per address', async () => {
    incrementRateLimit.mockResolvedValue(31);
    expect(await recordFailedAuth('203.0.113.9')).toEqual({
      limited: true,
      retryAfterSeconds: 60
    });
    expect(incrementRateLimit).toHaveBeenCalledWith('api:fail:203.0.113.9', 60);
  });

  it('caps every request per address', async () => {
    incrementRateLimit.mockResolvedValue(601);
    expect((await checkIpRateLimit('203.0.113.9')).limited).toBe(true);
  });

  it('falls back to process memory when no shared store answers', async () => {
    incrementRateLimit.mockResolvedValue(0);
    const key = `fallback-${Math.random()}`;
    const results = [];
    for (let i = 0; i < 3; i += 1) {
      results.push(
        await checkBucketRateLimit({
          bucket: 'test',
          identifier: key,
          limit: 2,
          windowSeconds: 60
        })
      );
    }
    expect(results[0].limited).toBe(false);
    expect(results[2].limited).toBe(true);
  });

  it('falls back to process memory when the store throws', async () => {
    incrementRateLimit.mockRejectedValue(new Error('redis down'));
    const key = `throws-${Math.random()}`;
    const first = await checkBucketRateLimit({
      bucket: 'test',
      identifier: key,
      limit: 1,
      windowSeconds: 60
    });
    const second = await checkBucketRateLimit({
      bucket: 'test',
      identifier: key,
      limit: 1,
      windowSeconds: 60
    });
    expect(first.limited).toBe(false);
    expect(second.limited).toBe(true);
  });

  it('formats Retry-After', () => {
    expect(rateLimitedHeaders(60)).toEqual({ 'Retry-After': '60' });
  });
});
