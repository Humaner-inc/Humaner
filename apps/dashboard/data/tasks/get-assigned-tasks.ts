import 'server-only';

import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
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
