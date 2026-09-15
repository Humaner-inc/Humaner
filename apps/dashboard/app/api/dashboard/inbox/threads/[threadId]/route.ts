import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getMailThread } from '@/data/inbox/get-mail-threads';
import { dedupedAuth } from '@/lib/auth';
import { requireApiDashboardPageAccess } from '@/lib/auth/require-workspace-access';
import { checkSession } from '@/lib/auth/session';
import { runWithTenantScope } from '@/lib/db/tenant-context';

const threadIdSchema = z.string().uuid();

export async function GET(
  _request: Request,
  props: { params: Promise<{ threadId: string }> }
): Promise<Response> {
  const access = await requireApiDashboardPageAccess('inbox');
  if (!access.ok) {
    return access.response;
  }

  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { threadId } = await props.params;
  if (!threadIdSchema.safeParse(threadId).success) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const organizationId = session.user.organizationId;
  return runWithTenantScope(organizationId, async () => {
    const thread = await getMailThread(threadId);
    if (!thread) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    return NextResponse.json(thread, {
      headers: { 'Cache-Control': 'private, no-store' }
    });
  });
}
