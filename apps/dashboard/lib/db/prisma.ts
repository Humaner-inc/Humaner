// Use the app-generated client (custom output). Bare `@prisma/client` can resolve
// to a stale copy in the pnpm store at runtime and miss newer schema fields.
import { resolveDatabaseUrl } from '@/lib/db/database-url';
import {
  getTenantOrganizationId,
  TENANT_SCOPED_MODELS
} from '@/lib/db/tenant-context';
import { applyTenantQueryArgs } from '@/lib/db/tenant-query';
import { PrismaClient } from '@/lib/generated/prisma';
import { signalMailboxRosterChanged } from '@/lib/realtime/roster-signal';

declare global {
  // allow global `var` declarations
  var prisma: PrismaClient | undefined;
}

// reads are safe to repeat after Neon drops a pooled connection (P1017)
const READ_ACTIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy'
]);

function isClosedConnection(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P1017'
  );
}

// Writes that change which IMAP mailboxes the IDLE worker should watch.
const ROSTER_FIELDS = [
  'status',
  'imapHost',
  'imapPort',
  'imapUser',
  'imapPassword',
  'imapTls'
];

function changesIdleRoster(params: {
  model?: string;
  action: string;
  args?: { data?: Record<string, unknown>; update?: Record<string, unknown> };
}): boolean {
  if (params.model !== 'MailboxConnection') return false;
  if (
    ['create', 'createMany', 'delete', 'deleteMany'].includes(params.action)
  ) {
    return true;
  }
  if (!['update', 'updateMany', 'upsert'].includes(params.action)) return false;
  const data = { ...params.args?.data, ...params.args?.update };
  return ROSTER_FIELDS.some((field) => field in data);
}

// Anything that can change who a session is or what they may open.
const AUTH_MODELS = new Set(['Session', 'User', 'OrganizationMembership']);
const WRITE_ACTIONS = new Set([
  'create',
  'createMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany'
]);

function createPrismaClient(): PrismaClient {
  const url = resolveDatabaseUrl();
  const client = url
    ? new PrismaClient({
        datasources: { db: { url } }
      })
    : new PrismaClient();

  client.$use(async (params, next) => {
    const result = await next(params);
    if (changesIdleRoster(params)) signalMailboxRosterChanged();
    if (
      params.model &&
      AUTH_MODELS.has(params.model) &&
      WRITE_ACTIONS.has(params.action)
    ) {
      // Lazy: the cache module is server-only, which plain Node scripts
      // cannot import. A failed import there just means no cache to clear.
      void import('@/lib/auth/auth-cache')
        .then((cache) => cache.bumpAuthCacheEpoch())
        .catch(() => undefined);
    }
    return result;
  });

  // force organizationId onto tenant reads and writes, including findUnique
  client.$use(async (params, next) => {
    const organizationId = getTenantOrganizationId();
    const model = params.model;
    if (
      organizationId &&
      model &&
      params.action &&
      TENANT_SCOPED_MODELS.has(model)
    ) {
      params.args = applyTenantQueryArgs(
        params.action,
        params.args,
        organizationId
      );
    }

    try {
      return await next(params);
    } catch (error) {
      if (
        isClosedConnection(error) &&
        params.action &&
        READ_ACTIONS.has(params.action)
      ) {
        return next(params);
      }
      throw error;
    }
  });

  return client;
}

function isStalePrismaClient(client: PrismaClient | undefined): boolean {
  return Boolean(
    client &&
      typeof (client as { calendarEvent?: unknown }).calendarEvent ===
        'undefined'
  );
}

export const prisma = isStalePrismaClient(global.prisma)
  ? createPrismaClient()
  : (global.prisma ?? createPrismaClient());

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
