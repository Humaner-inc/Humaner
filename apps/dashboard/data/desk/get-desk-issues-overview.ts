import 'server-only';

import { redirect } from 'next/navigation';

import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import type {
  HandoffTicketStatus,
  HandoffTicketUrgency
} from '@/types/handoff-ticket';

export type DeskIssueOverviewItem = {
  id: string;
  subject: string;
  status: HandoffTicketStatus;
  urgency: HandoffTicketUrgency;
  agentName: string;
  updatedAt: string;
};

export type DeskIssuesOverview = {
  counts: {
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    total: number;
  };
  activeTickets: DeskIssueOverviewItem[];
};

export async function getDeskIssuesOverview(): Promise<DeskIssuesOverview> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const organizationId = session.user.organizationId;

  const [statusCounts, activeTickets] = await Promise.all([
    prisma.handoffTicket.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { _all: true }
    }),
    prisma.handoffTicket.findMany({
      where: {
        organizationId,
        status: { in: ['OPEN', 'IN_PROGRESS'] }
      },
      select: {
        id: true,
        subject: true,
        status: true,
        urgency: true,
        updatedAt: true,
        agent: { select: { name: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    })
  ]);

  const counts = {
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    total: 0
  };

  for (const row of statusCounts) {
    const count = row._count._all;
    counts.total += count;
    switch (row.status) {
      case 'OPEN':
        counts.open = count;
        break;
      case 'IN_PROGRESS':
        counts.inProgress = count;
        break;
      case 'RESOLVED':
        counts.resolved = count;
        break;
      case 'CLOSED':
        counts.closed = count;
        break;
      default:
        break;
    }
  }

  return {
    counts,
    activeTickets: activeTickets.map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status as HandoffTicketStatus,
      urgency: ticket.urgency as HandoffTicketUrgency,
      agentName: ticket.agent.name,
      updatedAt: ticket.updatedAt.toISOString()
    }))
  };
}
