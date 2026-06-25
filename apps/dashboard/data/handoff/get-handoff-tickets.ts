import 'server-only';

import type { HandoffTicketStatus, HandoffTicketUrgency } from '@/types/handoff-ticket';
import { redirect } from 'next/navigation';

import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export type HandoffTicketItem = {
  id: string;
  agentName: string;
  visitorEmail: string | null;
  subject: string;
  summary: string;
  transcript: string;
  note: string | null;
  status: HandoffTicketStatus;
  urgency: HandoffTicketUrgency;
  createdAt: Date;
};

export type HandoffDeskData = {
  humanDeskEnabled: boolean;
  supportEmail: string | null;
  tickets: HandoffTicketItem[];
};

export async function getHandoffDeskData(): Promise<HandoffDeskData> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const organizationId = session.user.organizationId;

  const [organization, tickets] = await Promise.all([
    prisma.organization.findFirst({
      where: { id: organizationId },
      select: { humanDeskEnabled: true, supportEmail: true }
    }),
    prisma.handoffTicket.findMany({
      where: { organizationId },
      select: {
        id: true,
        visitorEmail: true,
        subject: true,
        summary: true,
        transcript: true,
        note: true,
        status: true,
        urgency: true,
        createdAt: true,
        agent: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return {
    humanDeskEnabled: organization?.humanDeskEnabled ?? false,
    supportEmail: organization?.supportEmail ?? null,
    tickets: tickets.map((ticket) => ({
      id: ticket.id,
      agentName: ticket.agent.name,
      visitorEmail: ticket.visitorEmail,
      subject: ticket.subject,
      summary: ticket.summary,
      transcript: ticket.transcript,
      note: ticket.note,
      status: ticket.status,
      urgency: ticket.urgency,
      createdAt: ticket.createdAt
    }))
  };
}
