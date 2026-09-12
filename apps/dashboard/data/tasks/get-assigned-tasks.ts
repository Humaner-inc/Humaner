import 'server-only';

import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { getDemoHandoffTickets } from '@/lib/demo/demo-desk';
import { isLocalDemo } from '@/lib/demo/is-local-demo';
import type { HandoffTicketStatus } from '@/types/handoff-ticket';

export type AssignedTaskItem = {
  id: string;
  ticketNumber: number;
  subject: string;
  summary: string;
  status: HandoffTicketStatus;
  updatedAt: string;
};

function toAssignedTask(input: {
  id: string;
  ticketNumber: number;
  subject: string;
  summary: string;
  status: string;
  updatedAt: Date | string;
}): AssignedTaskItem {
  return {
    id: input.id,
    ticketNumber: input.ticketNumber,
    subject: input.subject,
    summary: input.summary,
    status: input.status as HandoffTicketStatus,
    updatedAt:
      typeof input.updatedAt === 'string'
        ? input.updatedAt
        : input.updatedAt.toISOString()
  };
}

export async function getAssignedTasks(): Promise<AssignedTaskItem[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) return [];

  const organizationId = session.user.organizationId;
  if (!organizationId) return [];

  if (isLocalDemo()) {
    const me = {
      id: session.user.id,
      name: session.user.name,
      image: session.user.image ?? null,
      email: session.user.email ?? null
    };
    return getDemoHandoffTickets(session.user.id, [me])
      .filter((ticket) => ticket.assignee?.id === session.user.id)
      .map((ticket) =>
        toAssignedTask({
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          summary: ticket.summary,
          status: ticket.status,
          updatedAt: ticket.updatedAt
        })
      );
  }

  const tickets = await prisma.handoffTicket.findMany({
    where: {
      organizationId,
      assigneeId: session.user.id
    },
    orderBy: { updatedAt: 'desc' },
    take: 200,
    select: {
      id: true,
      ticketNumber: true,
      subject: true,
      summary: true,
      status: true,
      updatedAt: true
    }
  });

  return tickets.map(toAssignedTask);
}
