// Use the app-generated client (custom output). Bare `@prisma/client` can resolve
// to a stale copy in the pnpm store at runtime and miss newer schema fields.
import { resolveDatabaseUrl } from '@/lib/db/database-url';
import {
  getTenantOrganizationId,
  TENANT_SCOPED_MODELS
} from '@/lib/db/tenant-context';
import { applyTenantQueryArgs } from '@/lib/db/tenant-query';
import { PrismaClient } from '@/lib/generated/prisma';

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

function createPrismaClient(): PrismaClient {
  const url = resolveDatabaseUrl();
  const client = url
    ? new PrismaClient({
        datasources: { db: { url } }
      })
    : new PrismaClient();

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
