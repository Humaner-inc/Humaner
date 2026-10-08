import 'server-only';

import { prisma } from '@/lib/db/prisma';
import { getUpstashRedis } from '@/lib/redis/upstash';

// cron tries and user actions wait
const SYNC_LOCK_TIMEOUT_MS = 600_000;
const ACTION_LOCK_TIMEOUT_MS = 180_000;

// Redis lease: short TTL, refreshed while work runs, so a crashed process
// frees the mailbox within LEASE_TTL_MS. Nothing stays open in Postgres.
const LEASE_TTL_MS = 60_000;
const LEASE_REFRESH_MS = 20_000;
const LEASE_POLL_MS = 500;
const LEASE_MAX_WAIT_MS = 60_000;

const RELEASE_SCRIPT = `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end`;
const REFRESH_SCRIPT = `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('pexpire', KEYS[1], ARGV[2]) else return 0 end`;

function lockKey(connectionId: string): string {
  return `imap-mailbox:${connectionId}`;
}

const LOCK_SKIPPED = Symbol('imap-lock-skipped');

class LeaseUnavailableError extends Error {}

function isLocked(value: unknown): boolean {
  return value === true || value === 't';
}

async function withLease<T>(
  redis: NonNullable<ReturnType<typeof getUpstashRedis>>,
  connectionId: string,
  mode: 'wait' | 'try',
  work: () => Promise<T>,
  timeoutMs: number
): Promise<T | typeof LOCK_SKIPPED> {
  const key = `lock:${lockKey(connectionId)}`;
  const token = crypto.randomUUID();
  const deadline = Date.now() + LEASE_MAX_WAIT_MS;

  for (;;) {
    let acquired: string | null;
    try {
      acquired = await redis.set(key, token, { nx: true, px: LEASE_TTL_MS });
    } catch {
      throw new LeaseUnavailableError('Redis lease unavailable');
    }
    if (acquired === 'OK') break;
    if (mode === 'try') return LOCK_SKIPPED;
    if (Date.now() >= deadline) {
      throw new Error('IMAP mailbox lock was not acquired.');
    }
    await new Promise((resolve) => setTimeout(resolve, LEASE_POLL_MS));
  }

  // Stop refreshing after timeoutMs so a hung sync cannot hold the mailbox
  // forever; the lease then expires on its own.
  const holdUntil = Date.now() + timeoutMs;
  const heartbeat = setInterval(() => {
    if (Date.now() >= holdUntil) {
      clearInterval(heartbeat);
      return;
    }
    void redis
      .eval(REFRESH_SCRIPT, [key], [token, String(LEASE_TTL_MS)])
      .catch(() => undefined);
  }, LEASE_REFRESH_MS);

  try {
    return await work();
  } finally {
    clearInterval(heartbeat);
    try {
      await redis.eval(RELEASE_SCRIPT, [key], [token]);
    } catch {
      // the TTL releases it anyway
    }
  }
}

async function withLock<T>(
  connectionId: string,
  mode: 'wait' | 'try',
  work: () => Promise<T>,
  timeoutMs: number
): Promise<T | typeof LOCK_SKIPPED> {
  const redis = getUpstashRedis();
  if (redis) {
    try {
      return await withLease(redis, connectionId, mode, work, timeoutMs);
    } catch (error) {
      if (!(error instanceof LeaseUnavailableError)) throw error;
      // Redis outage: fall through to the DB lock.
    }
  }
  // Self-Host without Redis: xact advisory lock held for the whole sync.
  return withAdvisoryLock(connectionId, mode, work, timeoutMs);
}

async function withAdvisoryLock<T>(
  connectionId: string,
  mode: 'wait' | 'try',
  work: () => Promise<T>,
  timeoutMs: number
): Promise<T | typeof LOCK_SKIPPED> {
  return prisma.$transaction(
    async (tx) => {
      if (mode === 'try') {
        const rows = await tx.$queryRaw<Array<{ locked: boolean }>>`
          SELECT pg_try_advisory_xact_lock(hashtext(${lockKey(connectionId)})) AS "locked"
        `;
        if (!isLocked(rows[0]?.locked)) return LOCK_SKIPPED;
      } else {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey(connectionId)}))`;
      }
      return work();
    },
    {
      maxWait: mode === 'try' ? 5_000 : 60_000,
      timeout: timeoutMs
    }
  );
}

export async function withImapMailboxLock<T>(
  connectionId: string,
  work: () => Promise<T>
): Promise<T> {
  const result = await withLock(
    connectionId,
    'wait',
    work,
    ACTION_LOCK_TIMEOUT_MS
  );
  if (result === LOCK_SKIPPED) {
    throw new Error('IMAP mailbox lock was not acquired.');
  }
  return result;
}

// null when the mailbox lock is already held
export async function tryImapMailboxLock<T>(
  connectionId: string,
  work: () => Promise<T>
): Promise<T | null> {
  const result = await withLock(
    connectionId,
    'try',
    work,
    SYNC_LOCK_TIMEOUT_MS
  );
  if (result === LOCK_SKIPPED) return null;
  return result;
}
