import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { dedupedAuth } from '@/lib/auth';
import { AuthCookies } from '@/lib/auth/cookies';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import type { SessionDto } from '@/types/dtos/session-dto';
import { SortDirection } from '@/types/sorty-direction';

export async function getSessions(): Promise<SessionDto[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const cookieStore = await cookies();
  const currrentSessionToken =
    cookieStore.get(AuthCookies.SessionToken)?.value ?? '';

  const now = new Date();
  const sessions = await prisma.session.findMany({
    where: {
      userId: session.user.id,
      expires: {
        gt: now
      }
    },
    select: {
      id: true,
      sessionToken: true,
      expires: true
    },
    orderBy: {
      expires: SortDirection.Desc
    }
  });

  return sessions.map((s) => ({
    id: s.id,
    isCurrent: s.sessionToken === currrentSessionToken,
    expires: s.expires
  }));
}
