import 'server-only';

import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

/** Active Human Desk tickets for the org — used as the Desk sidebar badge. */
export async function getHandoffOpenCount(): Promise<number> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return 0;
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) {
    return 0;
  }

  return prisma.handoffTicket.count({
    where: {
      organizationId,
      status: { in: ['OPEN', 'IN_PROGRESS'] },
      routedTo: 'HUMAN'
    }
  });
}
