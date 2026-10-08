import { NextResponse } from 'next/server';

import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { signHubToken } from '@/lib/realtime/hub-token';

/**
 * Hands the browser a short-lived token for the realtime hub on Railway.
 * `url: null` means no hub is configured; the client falls back to the
 * serverless SSE route.
 */
export async function GET(): Promise<NextResponse> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hubUrl = process.env.REALTIME_HUB_URL?.trim();
  const organizationId = session.user.organizationId;
  const signed = organizationId
    ? signHubToken(organizationId, {
        id: session.user.id,
        name: session.user.name
      })
    : null;
  if (!hubUrl || !signed) {
    return NextResponse.json({ url: null });
  }

  return NextResponse.json(
    { url: hubUrl.replace(/\/$/, ''), ...signed },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
