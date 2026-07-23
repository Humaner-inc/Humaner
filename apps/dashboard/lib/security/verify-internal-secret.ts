import 'server-only';

import { timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';

// Shared-secret gate for internal HTTP endpoints

export function verifyInternalSecret(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_SECRET ?? process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const header =
    request.headers.get('x-internal-secret') ??
    request.headers.get('authorization');
  if (!header) {
    return false;
  }

  const provided = header.startsWith('Bearer ')
    ? header.slice('Bearer '.length)
    : header;

  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
