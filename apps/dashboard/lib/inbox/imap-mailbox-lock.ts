import 'server-only';

import { prisma } from '@/lib/db/prisma';

// xact advisory lock, cron tries and user actions wait
const SYNC_LOCK_TIMEOUT_MS = 600_000;
const ACTION_LOCK_TIMEOUT_MS = 180_000;

function lockKey(connectionId: string): string {
  return `imap-mailbox:${connectionId}`;
}

const LOCK_SKIPPED = Symbol('imap-lock-skipped');

function isLocked(value: unknown): boolean {
  return value === true || value === 't';
}

async function withLock<T>(
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
