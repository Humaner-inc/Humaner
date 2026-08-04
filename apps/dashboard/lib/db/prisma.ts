// Use the app-generated client (custom output). Bare `@prisma/client` can resolve
// to a stale copy in the pnpm store at runtime and miss newer schema fields.
import { resolveDatabaseUrl } from '@/lib/db/database-url';
import { PrismaClient } from '@/lib/generated/prisma';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const url = resolveDatabaseUrl();
  if (url) {
    return new PrismaClient({
      datasources: { db: { url } }
    });
  }
  return new PrismaClient();
}

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
