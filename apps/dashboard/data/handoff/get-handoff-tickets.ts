import 'server-only';

import { redirect } from 'next/navigation';

import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { requireDashboardPageOrRedirect } from '@/lib/auth/require-workspace-access';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { getDemoHandoffTickets } from '@/lib/demo/demo-desk';
import { isLocalDemo } from '@/lib/demo/is-local-demo';
import { resolveTicketSlaMinutes } from '@/lib/desk/resolve-ticket-sla';
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

export async function getHandoffDeskData(): Promise<HandoffDeskData> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  await requireDashboardPageOrRedirect('desk');

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
        source: true,
        status: true,
        urgency: true,
        routedTo: true,
        clusterId: true,
        runbookId: true,
        resolvedAt: true,
        resolvedBy: true,
        resolvedByName: true,
        loopStatus: true,
        loopSolvedAt: true,
        loopError: true,
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

  const mappedTeamMembers = teamMembers.map((membership) => ({
    id: membership.user.id,
    name: membership.user.name,
    image: membership.user.image,
    email: membership.user.email
  }));

  const mappedTickets = tickets.map((ticket) => {
    const urgency = ticket.urgency as HandoffTicketUrgency;
    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      agentId: ticket.agentId,
      agentName: ticket.agent.name,
      slaMinutes: resolveTicketSlaMinutes({
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
      // Heavy fields are loaded on ticket select via getHandoffTicketDetail.
      whySummary: null,
      howSummary: null,
      transcript: '',
      note: null,
      source: ticket.source,
      status: ticket.status as HandoffTicketStatus,
      urgency,
      routedTo: toDeskRoutedTo(ticket.routedTo),
      clusterId: ticket.clusterId,
      runbookId: ticket.runbookId,
      resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
      resolvedBy: ticket.resolvedBy ?? null,
      resolvedByName: ticket.resolvedByName ?? null,
      resolutionSolution: null,
      loopStatus: ticket.loopStatus ?? null,
      draftSolution: null,
      loopSolvedAt: ticket.loopSolvedAt?.toISOString() ?? null,
      loopError: ticket.loopError ?? null,
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
  });

  return {
    humanDeskEnabled: isLocalDemo()
      ? true
      : (organization?.humanDeskEnabled ?? false),
    supportEmail: isLocalDemo()
      ? (organization?.supportEmail ?? 'support@demo.humaner.local')
      : (organization?.supportEmail ?? null),
    liveChatEnabled: organization?.liveChatEnabled ?? false,
    liveChatTimeoutMinutes: organization?.liveChatTimeoutMinutes ?? 20,
    liveChatTimeoutMessage: organization?.liveChatTimeoutMessage ?? null,
    noreplyEmailRepliesEnabled:
      organization?.noreplyEmailRepliesEnabled ?? false,
    hasConnectedMailbox: mailFromRows.length > 0,
    mailFromAddresses,
    integrationProfile,
    currentUserId: session.user.id,
    teamMembers: mappedTeamMembers,
    businessHours,
    tickets: isLocalDemo()
      ? getDemoHandoffTickets(session.user.id, mappedTeamMembers)
      : mappedTickets
  };
}
