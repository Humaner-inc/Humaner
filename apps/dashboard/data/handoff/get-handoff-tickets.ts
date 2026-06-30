import 'server-only';

import type { HandoffTicketStatus, HandoffTicketUrgency } from '@/types/handoff-ticket';
import { redirect } from 'next/navigation';

import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import {
  resolveHandoffIntegrationProfile,
  type HandoffIntegrationProfile
} from '@/lib/integrations/handoff-integration-profile';

import type { HandoffInboxAssignee, HandoffInboxTicket } from '@/lib/handoff/handoff-inbox';

const HANDOFF_TICKET_LIMIT = 500;

export type HandoffTeamMember = HandoffInboxAssignee;

export type HandoffTicketItem = HandoffInboxTicket;

export type HandoffDeskData = {
  humanDeskEnabled: boolean;
  supportEmail: string | null;
  liveChatEnabled: boolean;
  liveChatTimeoutMinutes: number;
  liveChatTimeoutMessage: string | null;
  integrationProfile: HandoffIntegrationProfile;
  currentUserId: string;
  teamMembers: HandoffTeamMember[];
  tickets: HandoffTicketItem[];
};

export async function getHandoffDeskData(): Promise<HandoffDeskData> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const organizationId = session.user.organizationId;

  const [organization, tickets, teamMembers, apiKeyCount] = await Promise.all([
    prisma.organization.findFirst({
      where: { id: organizationId },
      select: {
        humanDeskEnabled: true,
        supportEmail: true,
        liveChatEnabled: true,
        liveChatTimeoutMinutes: true,
        liveChatTimeoutMessage: true,
        onboardingIntegrations: true
      }
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
        source: true,
        status: true,
        urgency: true,
        assignedAt: true,
        createdAt: true,
        updatedAt: true,
        agent: { select: { name: true } },
        assignee: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true
          }
        }
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      take: HANDOFF_TICKET_LIMIT
    }),
    prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        image: true,
        email: true
      },
      orderBy: { name: 'asc' }
    }),
    prisma.apiKey.count({
      where: { organizationId }
    })
  ]);

  const integrationProfile = resolveHandoffIntegrationProfile({
    onboardingIntegrations: organization?.onboardingIntegrations ?? [],
    hasApiKeys: apiKeyCount > 0
  });

  return {
    humanDeskEnabled: organization?.humanDeskEnabled ?? false,
    supportEmail: organization?.supportEmail ?? null,
    liveChatEnabled: organization?.liveChatEnabled ?? false,
    liveChatTimeoutMinutes: organization?.liveChatTimeoutMinutes ?? 20,
    liveChatTimeoutMessage: organization?.liveChatTimeoutMessage ?? null,
    integrationProfile,
    currentUserId: session.user.id,
    teamMembers: teamMembers.map((member) => ({
      id: member.id,
      name: member.name,
      image: member.image,
      email: member.email
    })),
    tickets: tickets.map((ticket) => ({
      id: ticket.id,
      agentName: ticket.agent.name,
      visitorEmail: ticket.visitorEmail,
      subject: ticket.subject,
      summary: ticket.summary,
      transcript: ticket.transcript,
      note: ticket.note,
      source: ticket.source,
      status: ticket.status as HandoffTicketStatus,
      urgency: ticket.urgency as HandoffTicketUrgency,
      assignee: ticket.assignee
        ? {
            id: ticket.assignee.id,
            name: ticket.assignee.name,
            image: ticket.assignee.image,
            email: ticket.assignee.email
          }
        : null,
      assignedAt: ticket.assignedAt?.toISOString() ?? null,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString()
    }))
  };
}
