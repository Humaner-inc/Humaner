/**
 * Prisma opens a pool per Node process. Cap connections so serverless
 * instances do not exhaust the Neon pooler.
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

  return url;
}
