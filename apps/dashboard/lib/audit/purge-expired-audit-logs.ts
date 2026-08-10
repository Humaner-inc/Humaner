import 'server-only';

import { AUDIT_LOG_RETENTION_MS } from '@/lib/audit/events';
import { prisma } from '@/lib/db/prisma';

/**
 * Purge audit rows older than the 2-year minimum retention window.
 *
 * Uses a single interactive transaction so `SET LOCAL` and `DELETE` share a
 * connection (required with PgBouncer transaction pooling). The immutability
 * trigger only allows DELETE when `app.allow_audit_purge = true`.
 */
/** Bound rows deleted per invocation so a large backlog can't exceed the cron timeout. */
const MAX_ROWS_PER_RUN = 50_000;

export async function purgeExpiredAuditLogs(): Promise<{ deleted: number }> {
  const cutoff = new Date(Date.now() - AUDIT_LOG_RETENTION_MS);

  return prisma.$transaction(async (tx) => {
    // Transaction-local GUC — must be same connection as the DELETE below.
    await tx.$executeRaw`SELECT set_config('app.allow_audit_purge', 'true', true)`;

    // Raw DELETE keeps the GUC check and mutation on one statement path.
    // Capped via a subselect so one night can't delete an unbounded backlog.
    const deleted = await tx.$executeRaw`
      DELETE FROM "AuditLog"
      WHERE "id" IN (
        SELECT "id" FROM "AuditLog"
        WHERE "createdAt" < ${cutoff}
        LIMIT ${MAX_ROWS_PER_RUN}
      )
    `;

    return { deleted: typeof deleted === 'number' ? deleted : 0 };
  });
}
