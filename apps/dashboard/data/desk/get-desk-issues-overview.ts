import 'server-only';

import { redirect } from 'next/navigation';

import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { getDemoDeskIssuesOverview } from '@/lib/demo/demo-desk';
import { isLocalDemo } from '@/lib/demo/is-local-demo';
import type {
  HandoffTicketStatus,
  HandoffTicketUrgency
} from '@/types/handoff-ticket';

export type DeskIssueOverviewItem = {
  id: string;
  ticketNumber: number;
  subject: string;
  status: HandoffTicketStatus;
  urgency: HandoffTicketUrgency;
  visitorEmail: string | null;
  visitorFirstName: string | null;
  visitorLastName: string | null;
  summary: string;
  note: string | null;
  agentName: string;
  assigneeId: string | null;
  updatedAt: string;
};

export type DeskOverviewAssignee = {
  id: string;
  name: string;
  image: string | null;
  email: string | null;
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
  teamMembers: DeskOverviewAssignee[];
  currentUserId: string;
};

export async function getDeskIssuesOverview(): Promise<DeskIssuesOverview> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const organizationId = session.user.organizationId;
  const currentUserId = session.user.id;

  if (isLocalDemo()) {
    const teamMembers = await prisma.organizationMembership.findMany({
      where: { organizationId },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true
          }
        }
      },
      orderBy: { user: { name: 'asc' } }
    });

    return getDemoDeskIssuesOverview(
      currentUserId,
      teamMembers.map((membership) => ({
        id: membership.user.id,
        name: membership.user.name,
        image: membership.user.image,
        email: membership.user.email
      }))
    );
  }

  const [statusCounts, activeTickets, teamMembers] = await Promise.all([
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
        ticketNumber: true,
        subject: true,
        status: true,
        urgency: true,
        visitorEmail: true,
        visitorFirstName: true,
        visitorLastName: true,
        summary: true,
        note: true,
        assigneeId: true,
        updatedAt: true,
        agent: { select: { name: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    }),
    prisma.organizationMembership.findMany({
      where: { organizationId },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true
          }
        }
      },
      orderBy: { user: { name: 'asc' } }
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
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      status: ticket.status as HandoffTicketStatus,
      urgency: ticket.urgency as HandoffTicketUrgency,
      visitorEmail: ticket.visitorEmail,
      visitorFirstName: ticket.visitorFirstName,
      visitorLastName: ticket.visitorLastName,
      summary: ticket.summary,
      note: ticket.note,
      agentName: ticket.agent.name,
      assigneeId: ticket.assigneeId,
      updatedAt: ticket.updatedAt.toISOString()
    })),
    teamMembers: teamMembers.map((membership) => ({
      id: membership.user.id,
      name: membership.user.name,
      image: membership.user.image,
      email: membership.user.email
    })),
    currentUserId
  };
}
