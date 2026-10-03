// Use the app-generated client (custom output). Bare `@prisma/client` can resolve
// to a stale copy in the pnpm store at runtime and miss newer schema fields.
import { resolveDatabaseUrl } from '@/lib/db/database-url';
import {
  getTenantOrganizationId,
  TENANT_SCOPED_MODELS
} from '@/lib/db/tenant-context';
import { PrismaClient } from '@/lib/generated/prisma';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const WHERE_ACTIONS = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'count',
  'aggregate',
  'groupBy',
  'updateMany',
  'deleteMany'
]);

/** Reads are safe to repeat after Neon drops a pooled connection (P1017). */
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

function injectTenantWhere(
  args: { where?: Record<string, unknown> } | undefined,
  organizationId: string
) {
  const next = args ?? {};
  const where = (next.where ?? {}) as Record<string, unknown>;
  if (where.organizationId === undefined) {
    where.organizationId = organizationId;
  }
  next.where = where;
  return next;
}

function createPrismaClient(): PrismaClient {
  const url = resolveDatabaseUrl();
  const client = url
    ? new PrismaClient({
        datasources: { db: { url } }
      })
    : new PrismaClient();

  // Soft tenant guard: when AsyncLocalStorage has an org, inject organizationId
  // into list/filter queries for tenant-scoped models. findUnique / update-by-id
  // stay unchanged so publicId lookups and nested writes keep working.
  client.$use(async (params, next) => {
    const organizationId = getTenantOrganizationId();
    const model = params.model;
    if (
      organizationId &&
      model &&
      params.action &&
      TENANT_SCOPED_MODELS.has(model)
    ) {
      if (WHERE_ACTIONS.has(params.action)) {
        params.args = injectTenantWhere(params.args, organizationId);
      } else if (params.action === 'create') {
        const data = (params.args?.data ?? {}) as Record<string, unknown>;
        if (data.organizationId === undefined) {
          data.organizationId = organizationId;
        }
        params.args = { ...params.args, data };
      }
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
