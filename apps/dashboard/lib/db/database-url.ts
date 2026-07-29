/**
 * Prisma opens a pool per Node process. Supabase pooler (port 6543) has a finite
 * connection budget; without `connection_limit` Prisma defaults to ~num_cpus*2+1
 * which can exhaust the pool under normal API load + dashboard UI queries.
 */
export function resolveDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    return undefined;
  }

  const limit = process.env.DATABASE_CONNECTION_LIMIT?.trim() || '5';
  const poolTimeout = process.env.DATABASE_POOL_TIMEOUT?.trim() || '20';

  let url = raw;

  if (!/[?&]connection_limit=/.test(url)) {
    url += url.includes('?') ? '&' : '?';
    url += `connection_limit=${encodeURIComponent(limit)}`;
  }

  if (!/[?&]pool_timeout=/.test(url)) {
    url += `&pool_timeout=${encodeURIComponent(poolTimeout)}`;
  }

  // Supabase transaction pooler (6543): required for Prisma + PgBouncer.
  if (/:6543\b/.test(url) && !/[?&]pgbouncer=/.test(url)) {
    url += '&pgbouncer=true';
  }

  return url;
}
