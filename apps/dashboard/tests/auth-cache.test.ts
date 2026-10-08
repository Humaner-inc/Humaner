import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  bumpAuthCacheEpoch,
  probeAuthCache,
  storeAuthCache
} from '@/lib/auth/auth-cache';

vi.mock('server-only', () => ({}));

const store = new Map<string, unknown>();
let failing = false;

const fakeRedis = {
  async mget(...keys: string[]) {
    if (failing) throw new Error('redis down');
    return keys.map((key) => store.get(key) ?? null);
  },
  async set(key: string, value: unknown) {
    if (failing) throw new Error('redis down');
    store.set(key, value);
    return 'OK';
  },
  async incr(key: string) {
    if (failing) throw new Error('redis down');
    const next = Number(store.get(key) ?? 0) + 1;
    store.set(key, next);
    return next;
  }
};

vi.mock('@/lib/redis/upstash', () => ({
  getUpstashRedis: () => fakeRedis
}));

describe('auth cache', () => {
  beforeEach(() => {
    store.clear();
    failing = false;
    process.env.AUTH_CACHE_TTL_SECONDS = '30';
  });

  it('is off unless a TTL is configured', async () => {
    delete process.env.AUTH_CACHE_TTL_SECONDS;
    const probe = await probeAuthCache('k');
    await storeAuthCache('k', { a: 1 }, probe.epoch);
    expect((await probeAuthCache('k')).value).toBeNull();
    expect(store.size).toBe(0);
  });

  it('returns a stored value while the epoch is unchanged', async () => {
    const probe = await probeAuthCache<{ a: number }>('k');
    expect(probe.value).toBeNull();
    await storeAuthCache('k', { a: 1 }, probe.epoch);
    expect((await probeAuthCache<{ a: number }>('k')).value).toEqual({ a: 1 });
  });

  it('drops every entry once any auth write bumps the epoch', async () => {
    const probe = await probeAuthCache('k');
    await storeAuthCache('k', { a: 1 }, probe.epoch);
    bumpAuthCacheEpoch();
    await Promise.resolve();
    expect((await probeAuthCache('k')).value).toBeNull();
  });

  it('does not cache data read before a concurrent write (race)', async () => {
    const probe = await probeAuthCache('k'); // epoch read before the DB lookup
    bumpAuthCacheEpoch(); // role changed while the lookup was in flight
    await Promise.resolve();
    await storeAuthCache('k', { role: 'old' }, probe.epoch);
    expect((await probeAuthCache('k')).value).toBeNull();
  });

  it('fails open when Redis errors', async () => {
    failing = true;
    const probe = await probeAuthCache('k');
    expect(probe).toEqual({ value: null, epoch: null });
    await expect(storeAuthCache('k', 1, probe.epoch)).resolves.toBeUndefined();
  });
});
