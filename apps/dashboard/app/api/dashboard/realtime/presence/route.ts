import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import {
  getResourcePresence,
  heartbeatPresence
} from '@/lib/realtime/org-events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  resourceType: z.enum(['ticket', 'thread']),
  resourceId: z.string().uuid(),
  heartbeat: z.boolean().optional()
});

export async function GET(request: NextRequest): Promise<Response> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resourceType = request.nextUrl.searchParams.get('resourceType');
  const resourceId = request.nextUrl.searchParams.get('resourceId');
  const parsed = bodySchema.safeParse({
    resourceType,
    resourceId,
    heartbeat: false
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  }

  const presence = await getResourcePresence({
    organizationId: session.user.organizationId,
    resourceType: parsed.data.resourceType,
    resourceId: parsed.data.resourceId
  });

  return NextResponse.json({ presence });
}

export async function POST(request: NextRequest): Promise<Response> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const presence = await heartbeatPresence({
    organizationId: session.user.organizationId,
    resourceType: parsed.data.resourceType,
    resourceId: parsed.data.resourceId,
    userId: session.user.id,
    userName: session.user.name || 'Teammate'
  });

  return NextResponse.json({ presence });
}
