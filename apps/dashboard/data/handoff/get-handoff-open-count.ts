import 'server-only';

import { dedupedAuth } from '@/lib/auth';
import { userCanAccessDashboardPage } from '@/lib/auth/require-workspace-access';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export type HandoffOpenCounts = {
  humanOpen: number;
  agentOpen: number;
};

/** Active desk tickets for the org — used as Desk sidebar badges. */
export async function getHandoffOpenCounts(): Promise<HandoffOpenCounts> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return { humanOpen: 0, agentOpen: 0 };
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) {
    return { humanOpen: 0, agentOpen: 0 };
  }

  if (!(await userCanAccessDashboardPage(session.user.id, 'desk'))) {
    return { humanOpen: 0, agentOpen: 0 };
  }

  const [humanOpen, agentOpen] = await Promise.all([
    prisma.handoffTicket.count({
      where: {
        organizationId,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        routedTo: 'HUMAN'
      }
    }),
    prisma.handoffTicket.count({
      where: {
        organizationId,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        routedTo: 'AI'
      }
    })
  ]);

  return { humanOpen, agentOpen };
}

/** @deprecated Prefer getHandoffOpenCounts — kept for call sites that only need Human. */
export async function getHandoffOpenCount(): Promise<number> {
  const counts = await getHandoffOpenCounts();
  return counts.humanOpen;
}
