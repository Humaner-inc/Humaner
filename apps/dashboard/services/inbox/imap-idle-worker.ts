import 'server-only';

import {
  isImapAuthError,
  markMailboxNeedsReauth,
  syncImapConnection
} from '@/services/inbox/sync-imap-mailboxes';
import { MailConnectionStatus, MailProvider } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { validateMailEndpoints } from '@/lib/inbox/validate-mail-endpoint';
import { publishOrgEvent } from '@/lib/realtime/org-events';
import { onMailboxRosterChanged } from '@/lib/realtime/roster-signal';
import { decryptSensitiveField } from '@/lib/security/sensitive-fields';

type IdleConfig = {
  enabled: boolean;
  maxConnections: number;
  reconnectMs: number;
  rosterRefreshMs: number;
  syncDebounceMs: number;
  /** Optional all-folder tick (0 = off). Other folders sync when opened. */
  fullSyncMs: number;
};

type IdleConnectionRow = {
  id: string;
  organizationId: string;
  email: string;
  imapHost: string | null;
  imapPort: number | null;
  imapUser: string | null;
  imapPassword: string | null;
  imapTls: boolean;
  smtpHost: string | null;
  smtpPort: number | null;
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export function getImapIdleConfig(): IdleConfig {
  return {
    enabled: process.env.IMAP_IDLE_ENABLED === 'true',
    maxConnections: parsePositiveInt(process.env.IMAP_IDLE_MAX_CONNECTIONS, 50),
    reconnectMs: parsePositiveInt(process.env.IMAP_IDLE_RECONNECT_MS, 5_000),
    rosterRefreshMs: parsePositiveInt(
      process.env.IMAP_IDLE_ROSTER_REFRESH_MS,
      // With the hub, roster changes are pushed; this is only a safety net.
      process.env.REALTIME_HUB_ENABLED === 'true' ? 1_800_000 : 300_000
    ),
    syncDebounceMs: parsePositiveInt(
      process.env.IMAP_IDLE_SYNC_DEBOUNCE_MS,
      1_000
    ),
    fullSyncMs: process.env.IMAP_IDLE_FULL_SYNC_MS
      ? parsePositiveInt(process.env.IMAP_IDLE_FULL_SYNC_MS, 0)
      : 0
  };
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

class ImapIdleSession {
  private stopped = false;
  private client: import('imapflow').ImapFlow | null = null;
  private syncTimer: ReturnType<typeof setTimeout> | null = null;
  private syncChain: Promise<void> = Promise.resolve();
  private reconnectAttempt = 0;
  private lockRetries = 0;

  constructor(
    private readonly connection: IdleConnectionRow,
    private readonly config: IdleConfig,
    private readonly signal: AbortSignal
  ) {}

  stop(): void {
    this.stopped = true;
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    const client = this.client;
    this.client = null;
    if (client) {
      void (async () => {
        try {
          await client.logout();
        } catch {
          try {
            await client.close();
          } catch {
            // ignore
          }
        }
      })();
    }
  }

  async run(): Promise<void> {
    while (!this.stopped && !this.signal.aborted) {
      try {
        await this.connectAndIdle();
        this.reconnectAttempt = 0;
      } catch (error) {
        if (this.stopped || this.signal.aborted) return;

        if (isImapAuthError(error)) {
          await markMailboxNeedsReauth(
            this.connection.id,
            error instanceof Error
              ? error.message
              : 'IMAP authentication failed'
          );
          console.error(
            `[imap-idle] auth failed for ${this.connection.email}; marked NEEDS_REAUTH`
          );
          return;
        }

        this.reconnectAttempt += 1;
        const delay = Math.min(
          this.config.reconnectMs * 2 ** Math.min(this.reconnectAttempt - 1, 5),
          5 * 60_000
        );
        console.warn(
          `[imap-idle] ${this.connection.email} disconnected; reconnect in ${delay}ms`,
          error instanceof Error ? error.message : error
        );
        try {
          await sleep(delay, this.signal);
        } catch {
          return;
        }
      }
    }
  }

  private scheduleSync(
    reason: string,
    delayMs = this.config.syncDebounceMs
  ): void {
    if (this.stopped || this.signal.aborted) return;
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.syncTimer = null;
      this.syncChain = this.syncChain
        .catch(() => undefined)
        .then(() => this.runSync(reason));
    }, delayMs);
  }

  private async runSync(reason: string): Promise<void> {
    const client = this.client;
    if (!client) return;
    try {
      const changes = { count: 0 };
      const imported = await syncImapConnection(this.connection.id, {
        client,
        changes,
        // new-mail events don't need a full flag scan; flag events/connect do
        skipFullFlagScan: reason.startsWith('exists'),
        lock: 'try',
        // Walking other folders on the IDLE socket would move it off INBOX and
        // drop later events. Other folders sync when the user opens them.
        folders: ['INBOX']
      });
      if (imported == null) {
        this.lockRetries += 1;
        if (this.lockRetries <= 4) {
          this.scheduleSync('lock-busy', 15_000);
        }
        return;
      }
      this.lockRetries = 0;
      if (imported === 0 && changes.count > 0) {
        // deleted or marked read in another client: refresh, no toast
        void publishOrgEvent(this.connection.organizationId, {
          type: 'inbox.synced',
          resourceId: this.connection.id,
          count: 0
        });
        console.log(
          `[imap-idle] ${this.connection.email}: ${changes.count} change(s) (${reason})`
        );
      }
      if (imported > 0) {
        void publishOrgEvent(this.connection.organizationId, {
          type: 'inbox.synced',
          resourceId: this.connection.id,
          count: imported
        });
        console.log(
          `[imap-idle] ${this.connection.email}: imported ${imported} (${reason})`
        );
      }
    } catch (error) {
      if (isImapAuthError(error)) {
        await markMailboxNeedsReauth(
          this.connection.id,
          error instanceof Error ? error.message : 'IMAP authentication failed'
        );
        this.stop();
        return;
      }
      console.error(
        `[imap-idle] sync failed for ${this.connection.email}`,
        error instanceof Error ? error.message : error
      );
    }
  }

  private async connectAndIdle(): Promise<void> {
    const imapHost = decryptSensitiveField(this.connection.imapHost);
    const imapUser = decryptSensitiveField(this.connection.imapUser);
    const imapPassword = decryptSensitiveField(this.connection.imapPassword);
    const smtpHost = decryptSensitiveField(this.connection.smtpHost);

    if (
      !imapHost ||
      !imapUser ||
      !imapPassword ||
      !this.connection.imapPort ||
      !smtpHost ||
      !this.connection.smtpPort
    ) {
      throw new Error('Mailbox connection is missing encrypted IMAP settings.');
    }

    const validatedHosts = await validateMailEndpoints({
      imapHost,
      imapPort: this.connection.imapPort,
      smtpHost,
      smtpPort: this.connection.smtpPort
    });

    const { ImapFlow } = await import('imapflow');
    const client = new ImapFlow({
      host: validatedHosts.imap.address,
      servername: validatedHosts.imap.hostname,
      port: this.connection.imapPort,
      secure: this.connection.imapTls,
      auth: { user: imapUser, pass: imapPassword },
      logger: false,
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000
    });

    this.client = client;

    const closed = new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        if (error) reject(error);
        else resolve();
      };
      // keep the error listener for the life of the socket
      client.on('error', (error: Error) => finish(error));
      client.once('close', () => finish());
      this.signal.addEventListener(
        'abort',
        () => {
          void (async () => {
            try {
              await client.logout();
            } catch {
              try {
                await client.close();
              } catch {
                // ignore
              }
            } finally {
              finish();
            }
          })();
        },
        { once: true }
      );
    });

    client.on('exists', (data: { count: number; prevCount: number }) => {
      if (data.count > data.prevCount) {
        this.scheduleSync(`exists ${data.prevCount}→${data.count}`);
      }
    });

    // read/unread and deletes from other clients arrive on the same IDLE socket
    client.on('flags', () => this.scheduleSync('flags'));
    client.on('expunge', () => this.scheduleSync('expunge'));

    await client.connect();
    await client.mailboxOpen('INBOX');
    console.log(`[imap-idle] watching ${this.connection.email}`);

    // catch up mail that arrived while offline
    this.scheduleSync('connect');

    const fullSyncTimer =
      this.config.fullSyncMs > 0
        ? setInterval(
            () => this.scheduleSync('periodic', 0),
            this.config.fullSyncMs
          )
        : null;

    try {
      await closed;
    } finally {
      if (fullSyncTimer) clearInterval(fullSyncTimer);
    }
    this.client = null;

    await this.syncChain.catch(() => undefined);

    if (!this.stopped && !this.signal.aborted) {
      throw new Error('IMAP IDLE connection closed');
    }
  }
}

async function loadIdleConnections(
  maxConnections: number
): Promise<IdleConnectionRow[]> {
  return prisma.mailboxConnection.findMany({
    where: {
      provider: MailProvider.IMAP,
      status: MailConnectionStatus.ACTIVE
    },
    orderBy: [{ lastSyncedAt: { sort: 'asc', nulls: 'first' } }],
    take: maxConnections,
    select: {
      id: true,
      organizationId: true,
      email: true,
      imapHost: true,
      imapPort: true,
      imapUser: true,
      imapPassword: true,
      imapTls: true,
      smtpHost: true,
      smtpPort: true
    }
  });
}

// long-lived imap idle process, not for serverless
export async function runImapIdleWorker(
  signal: AbortSignal = new AbortController().signal
): Promise<void> {
  const config = getImapIdleConfig();
  if (!config.enabled) {
    console.log(
      '[imap-idle] IMAP_IDLE_ENABLED is not true; worker exiting. Cron sync remains the fallback.'
    );
    return;
  }

  console.log(
    `[imap-idle] starting (maxConnections=${config.maxConnections}, reconnectMs=${config.reconnectMs})`
  );

  const sessions = new Map<string, ImapIdleSession>();

  const reconcile = async () => {
    const rows = await loadIdleConnections(config.maxConnections);
    const activeIds = new Set(rows.map((row) => row.id));

    for (const [id, session] of sessions) {
      if (!activeIds.has(id)) {
        session.stop();
        sessions.delete(id);
      }
    }

    for (const row of rows) {
      if (sessions.has(row.id) || signal.aborted) continue;
      const session = new ImapIdleSession(row, config, signal);
      sessions.set(row.id, session);
      void session.run().finally(() => {
        if (sessions.get(row.id) === session) {
          sessions.delete(row.id);
        }
      });
    }
  };

  await reconcile();

  let rosterTimer: ReturnType<typeof setTimeout> | null = null;
  const stopRosterListener = onMailboxRosterChanged(() => {
    if (rosterTimer || signal.aborted) return;
    rosterTimer = setTimeout(() => {
      rosterTimer = null;
      reconcile().catch((error) => {
        console.error(
          '[imap-idle] roster reload failed',
          error instanceof Error ? error.message : error
        );
      });
    }, 2_000);
  });

  while (!signal.aborted) {
    try {
      await sleep(config.rosterRefreshMs, signal);
    } catch {
      break;
    }
    try {
      await reconcile();
    } catch (error) {
      console.error(
        '[imap-idle] roster refresh failed',
        error instanceof Error ? error.message : error
      );
    }
  }

  stopRosterListener();
  if (rosterTimer) clearTimeout(rosterTimer);
  for (const session of sessions.values()) {
    session.stop();
  }
  sessions.clear();
  console.log('[imap-idle] stopped');
}
