import 'server-only';

import { getWorkspaceKnowledgeAgent } from '@/data/knowledge/get-workspace-knowledge';
import { prisma } from '@/lib/db/prisma';
import { createHandoffTicketWithNumber } from '@/lib/desk/allocate-ticket-number';

export async function createTaskFromMailThread(input: {
  threadId: string;
  organizationId: string;
  assigneeId?: string | null;
}): Promise<{ id: string; ticketNumber: number; existing: boolean }> {
  const thread = await prisma.mailThread.findFirst({
    where: { id: input.threadId, organizationId: input.organizationId },
    select: {
      id: true,
      subject: true,
      handoffTicketId: true,
      handoffTicket: { select: { id: true, ticketNumber: true } },
      messages: {
        orderBy: { sentAt: 'asc' },
        take: 40,
        select: {
          direction: true,
          fromAddress: true,
          bodyText: true,
          sentAt: true
        }
      }
    }
  });

  if (!thread) {
    throw new Error('Thread not found');
  }

  if (thread.handoffTicketId && thread.handoffTicket) {
    return {
      id: thread.handoffTicket.id,
      ticketNumber: thread.handoffTicket.ticketNumber,
      existing: true
    };
  }

  const agent = await getWorkspaceKnowledgeAgent(input.organizationId);
  if (!agent) {
    throw new Error('This workspace has no agent to attach tasks to yet.');
  }

  const firstInbound = thread.messages.find(
    (message) => message.direction === 'INBOUND'
  );
  const visitorEmail = firstInbound?.fromAddress
    ? firstInbound.fromAddress.replace(/^.*<([^>]+)>$/, '$1').trim()
    : null;
  const transcript = thread.messages
    .map((message) => {
      const body = (message.bodyText ?? '').trim().slice(0, 2000);
      return `[${message.direction}] ${message.fromAddress}\n${body}`;
    })
    .join('\n\n')
    .slice(0, 16000);

  const ticket = await createHandoffTicketWithNumber({
    organizationId: input.organizationId,
    agentId: agent.id,
    subject: thread.subject.slice(0, 255),
    summary: (firstInbound?.bodyText ?? thread.subject).trim().slice(0, 4000),
    transcript,
    visitorEmail: visitorEmail?.slice(0, 255) || null,
    source: 'EMAIL',
    status: 'OPEN',
    routedTo: 'HUMAN',
    assigneeId: input.assigneeId ?? null,
    assignedAt: input.assigneeId ? new Date() : null
  });

  await prisma.mailThread.update({
    where: { id: thread.id },
    data: { handoffTicketId: ticket.id }
  });

  return { ...ticket, existing: false };
}
