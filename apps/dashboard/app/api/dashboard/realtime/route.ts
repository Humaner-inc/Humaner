import { NextResponse, type NextRequest } from 'next/server';

import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { readOrgEventsSince } from '@/lib/realtime/org-events';

/** Long-lived SSE; keep under typical serverless max. */
export const maxDuration = 60;

const POLL_MS = 1_500;
const HEARTBEAT_MS = 15_000;
const MAX_HOLD_MS = 55_000;

/**
 * Org-scoped Server-Sent Events for multi-user sync.
 * Clients reconnect automatically; events are buffered in Redis for ~5 minutes.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const organizationId = session.user.organizationId;
  const sinceParam = request.nextUrl.searchParams.get('since');
  let sinceAt = Number(sinceParam);
  if (!Number.isFinite(sinceAt) || sinceAt < 0) {
    sinceAt = Date.now() - 5_000;
  }

  const encoder = new TextEncoder();
  const started = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown): void => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        );
      };

      send({ type: 'connected', at: Date.now(), organizationId });

      let lastHeartbeat = Date.now();

      while (Date.now() - started < MAX_HOLD_MS) {
        if (request.signal.aborted) {
          break;
        }

        const events = await readOrgEventsSince(organizationId, sinceAt, 50);
        for (const event of events) {
          sinceAt = Math.max(sinceAt, event.at);
          send({ type: 'event', event });
        }

        if (Date.now() - lastHeartbeat >= HEARTBEAT_MS) {
          send({ type: 'heartbeat', at: Date.now() });
          lastHeartbeat = Date.now();
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_MS));
      }

      send({ type: 'reconnect', at: Date.now(), since: sinceAt });
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
