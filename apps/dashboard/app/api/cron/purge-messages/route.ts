import { NextResponse, type NextRequest } from 'next/server';

import { purgeExpiredAuditLogs } from '@/lib/audit/purge-expired-audit-logs';
import { purgeExpiredHandoffTickets } from '@/lib/data-retention/purge-expired-handoff-tickets';
import { purgeExpiredMessageEmbeddings } from '@/lib/data-retention/purge-expired-message-embeddings';
import { purgeExpiredMessages } from '@/lib/data-retention/purge-expired-messages';
import { verifyCronSecret } from '@/lib/security/verify-cron-secret';

export async function GET(request: NextRequest): Promise<Response> {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [messages, tickets, auditLogs] = await Promise.all([
    purgeExpiredMessages(),
    purgeExpiredHandoffTickets(),
    purgeExpiredAuditLogs()
  ]);

  // After the message purge so it never touches rows that were about to be deleted.
  const messageEmbeddings = await purgeExpiredMessageEmbeddings();

  return NextResponse.json({
    messages,
    messageEmbeddings,
    tickets,
    auditLogs
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  return GET(request);
}
