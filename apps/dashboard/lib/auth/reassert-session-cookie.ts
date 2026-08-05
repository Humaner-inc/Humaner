import 'server-only';

import { cookies } from 'next/headers';

import { AuthCookies } from '@/lib/auth/cookies';
import { getSessionExpiryFromNow } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

/** Ensure the session cookie is present on the current Server Action response. */
export async function reassertSessionCookieForUser(
  userId: string
): Promise<void> {
  const latestSession = await prisma.session.findFirst({
    where: {
      userId,
      expires: { gt: new Date() }
    },
    orderBy: { expires: 'desc' },
    select: { sessionToken: true, expires: true }
  });

  if (!latestSession) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: AuthCookies.SessionToken,
    value: latestSession.sessionToken,
    ...AuthCookies.sessionCookieOptions(
      latestSession.expires ?? getSessionExpiryFromNow()
    )
  });
}
