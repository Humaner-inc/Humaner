import { NextResponse, type NextRequest } from 'next/server';

import { purgeExpiredHandoffTickets } from '@/lib/data-retention/purge-expired-handoff-tickets';
import { purgeExpiredMessages } from '@/lib/data-retention/purge-expired-messages';
import { verifyCronSecret } from '@/lib/security/verify-cron-secret';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<Response> {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [messages, tickets] = await Promise.all([
    purgeExpiredMessages(),
    purgeExpiredHandoffTickets()
  ]);

  return NextResponse.json({ messages, tickets });
}

export async function POST(request: NextRequest): Promise<Response> {
  return GET(request);
}
