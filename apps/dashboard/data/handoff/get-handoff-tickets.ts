import 'server-only';

import { redirect } from 'next/navigation';

import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { getTierForMode } from '@/lib/desk/escalation-framework';
import { toDeskRoutedTo } from '@/lib/desk/routed-to';
import type {
  HandoffInboxAssignee,
  HandoffInboxTicket
} from '@/lib/handoff/handoff-inbox';
import {
  resolveHandoffIntegrationProfile,
  type HandoffIntegrationProfile
} from '@/lib/integrations/handoff-integration-profile';
import type { WorkHoursDto } from '@/types/dtos/work-hours-dto';
import type {
  HandoffTicketStatus,
  HandoffTicketUrgency
} from '@/types/handoff-ticket';

const HANDOFF_TICKET_LIMIT = 500;

export type HandoffTeamMember = HandoffInboxAssignee;

export type HandoffTicketItem = HandoffInboxTicket;

export type HandoffDeskData = {
  humanDeskEnabled: boolean;
  supportEmail: string | null;
  liveChatEnabled: boolean;
  liveChatTimeoutMinutes: number;
  liveChatTimeoutMessage: string | null;
  noreplyEmailRepliesEnabled: boolean;
  hasConnectedMailbox: boolean;
  /** Enabled inbox aliases (and mailbox emails) available as From addresses. */
  mailFromAddresses: string[];
  integrationProfile: HandoffIntegrationProfile;
  currentUserId: string;
  teamMembers: HandoffTeamMember[];
  tickets: HandoffTicketItem[];
  businessHours: WorkHoursDto[];
};

function resolveSlaMinutes(input: {
  agentId: string;
  urgency: HandoffTicketUrgency;
  policies: Array<{
    agentId: string;
    urgencyLevel: HandoffTicketUrgency;
    mode: Parameters<typeof getTierForMode>[0];
    slaMinutes: number | null;
  }>;
}): number | null {
  const match = input.policies.find(
    (policy) =>
      policy.agentId === input.agentId && policy.urgencyLevel === input.urgency
  );
  if (match) return match.slaMinutes;

  // Fallback to tier defaults when no policy is configured.
  const tier = (
    [
      { urgency: 'HIGH' as const, mode: 'LIVE' as const },
      { urgency: 'MEDIUM' as const, mode: 'STANDARD' as const },
      { urgency: 'LOW' as const, mode: 'SELF_RESOLVING' as const }
    ] as const
  ).find((entry) => entry.urgency === input.urgency);

  return tier ? (getTierForMode(tier.mode)?.defaultSlaMinutes ?? null) : null;
}

export async function getHandoffDeskData(): Promise<HandoffDeskData> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const organizationId = session.user.organizationId;

  const [
    organization,
    tickets,
    teamMembers,
    apiKeyCount,
    policies,
    mailFromRows
  ] = await Promise.all([
    prisma.organization.findFirst({
      where: { id: organizationId },
      select: {
        humanDeskEnabled: true,
        supportEmail: true,
        liveChatEnabled: true,
        liveChatTimeoutMinutes: true,
        liveChatTimeoutMessage: true,
        noreplyEmailRepliesEnabled: true,
        onboardingIntegrations: true,
        businessHours: {
          select: {
            dayOfWeek: true,
            timeSlots: {
              select: { id: true, start: true, end: true }
            }
          }
        }
      }
    }),
    prisma.handoffTicket.findMany({
      where: { organizationId },
      select: {
        id: true,
        ticketNumber: true,
        agentId: true,
        visitorEmail: true,
        visitorFirstName: true,
        visitorLastName: true,
        visitorCompany: true,
        visitorLeftAt: true,
        subject: true,
        summary: true,
        whySummary: true,
        howSummary: true,
        transcript: true,
        note: true,
        source: true,
        status: true,
        urgency: true,
        routedTo: true,
        clusterId: true,
        runbookId: true,
        resolvedAt: true,
        resolvedBy: true,
        resolvedByName: true,
        resolutionSolution: true,
        liveChatTimedOut: true,
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
    }),
    prisma.escalationPolicy.findMany({
      where: { organizationId },
      select: {
        agentId: true,
        urgencyLevel: true,
        mode: true,
        slaMinutes: true
      }
    }),
    prisma.mailboxConnection.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        smtpHost: { not: null },
        smtpPassword: { not: null }
      },
      select: {
        email: true,
        aliases: {
          where: { enabled: true },
          orderBy: { address: 'asc' },
          select: { address: true }
        }
      }
    })
  ]);

  const supportEmail = organization?.supportEmail?.toLowerCase() ?? null;
  const mailFromAddresses = Array.from(
    new Set(
      mailFromRows.flatMap((connection) => {
        if (connection.aliases.length > 0) {
          return connection.aliases.map((alias) => alias.address);
        }
        return [connection.email];
      })
    )
  ).sort((a, b) => {
    if (supportEmail) {
      if (a.toLowerCase() === supportEmail) return -1;
      if (b.toLowerCase() === supportEmail) return 1;
    }
    return a.localeCompare(b);
  });

  const integrationProfile = resolveHandoffIntegrationProfile({
    onboardingIntegrations: organization?.onboardingIntegrations ?? [],
    hasApiKeys: apiKeyCount > 0
  });

  const businessHours: WorkHoursDto[] = (organization?.businessHours ?? []).map(
    (workHours) => ({
      dayOfWeek: workHours.dayOfWeek,
      timeSlots: workHours.timeSlots.map((timeSlot) => ({
        id: timeSlot.id,
        start: timeSlot.start.toISOString(),
        end: timeSlot.end.toISOString()
      }))
    })
  );

  const policyRows = policies.map((policy) => ({
    agentId: policy.agentId,
    urgencyLevel: policy.urgencyLevel as HandoffTicketUrgency,
    mode: policy.mode,
    slaMinutes: policy.slaMinutes
  }));

  return {
    humanDeskEnabled: organization?.humanDeskEnabled ?? false,
    supportEmail: organization?.supportEmail ?? null,
    liveChatEnabled: organization?.liveChatEnabled ?? false,
    liveChatTimeoutMinutes: organization?.liveChatTimeoutMinutes ?? 20,
    liveChatTimeoutMessage: organization?.liveChatTimeoutMessage ?? null,
    noreplyEmailRepliesEnabled:
      organization?.noreplyEmailRepliesEnabled ?? false,
    hasConnectedMailbox: mailFromRows.length > 0,
    mailFromAddresses,
    integrationProfile,
    currentUserId: session.user.id,
    teamMembers: teamMembers.map((member) => ({
      id: member.id,
      name: member.name,
      image: member.image,
      email: member.email
    })),
    businessHours,
    tickets: tickets.map((ticket) => {
      const urgency = ticket.urgency as HandoffTicketUrgency;
      return {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        agentId: ticket.agentId,
        agentName: ticket.agent.name,
        slaMinutes: resolveSlaMinutes({
          agentId: ticket.agentId,
          urgency,
          policies: policyRows
        }),
        visitorEmail: ticket.visitorEmail,
        visitorFirstName: ticket.visitorFirstName ?? null,
        visitorLastName: ticket.visitorLastName ?? null,
        visitorCompany: ticket.visitorCompany ?? null,
        visitorLeftAt: ticket.visitorLeftAt?.toISOString() ?? null,
        subject: ticket.subject,
        summary: ticket.summary,
        whySummary: ticket.whySummary ?? null,
        howSummary: ticket.howSummary ?? null,
        transcript: ticket.transcript,
        note: ticket.note,
        source: ticket.source,
        status: ticket.status as HandoffTicketStatus,
        urgency,
        routedTo: toDeskRoutedTo(ticket.routedTo),
        clusterId: ticket.clusterId,
        runbookId: ticket.runbookId,
        resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
        resolvedBy: ticket.resolvedBy ?? null,
        resolvedByName: ticket.resolvedByName ?? null,
        resolutionSolution: ticket.resolutionSolution ?? null,
        liveChatTimedOut: ticket.liveChatTimedOut ?? false,
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
      };
    })
  };
}
