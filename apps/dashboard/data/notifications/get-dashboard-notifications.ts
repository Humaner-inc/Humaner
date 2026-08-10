import 'server-only';

import { redirect } from 'next/navigation';
import { getEffectivePlan } from '@humaner/shared/plans';
import { subDays } from 'date-fns';

import { Routes } from '@/constants/routes';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { getMessagesUsedThisMonth } from '@/lib/billing/message-usage';
import { organizationBypassesPlanLimits } from '@/lib/billing/plan-limits';
import { normalizeTier } from '@/lib/billing/tier';
import { prisma } from '@/lib/db/prisma';
import { isOssDeployment } from '@/lib/deployment-mode';
import { formatTicketRef } from '@/lib/desk/ticket-ref';
import {
  parseActivityNotificationPreferences,
  shouldNotifyDeskInApp
} from '@/lib/notifications/activity-notification-preferences';
import { detectConversationHighlights } from '@/lib/notifications/conversation-highlights';
import { reportBugTabLabel } from '@/lib/report-bug-context-options';
import { supportTicketStatusLabel } from '@/lib/support-ticket-labels';
import type {
  DashboardNotification,
  DashboardNotificationsSnapshot
} from '@/types/dashboard-notification';
import type {
  HandoffTicketStatus,
  HandoffTicketUrgency
} from '@/types/handoff-ticket';

const HISTORY_LOOKBACK_DAYS = 14;

function severityRank(severity: DashboardNotification['severity']): number {
  switch (severity) {
    case 'critical':
      return 0;
    case 'warning':
      return 1;
    case 'success':
      return 2;
    default:
      return 3;
  }
}

function sortNotifications(
  items: DashboardNotification[]
): DashboardNotification[] {
  return [...items].sort((a, b) => {
    const severityDiff = severityRank(a.severity) - severityRank(b.severity);
    if (severityDiff !== 0) {
      return severityDiff;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function getDashboardNotifications(): Promise<DashboardNotificationsSnapshot> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const organizationId = session.user.organizationId;
  const userId = session.user.id;
  const items: DashboardNotification[] = [];
  const oss = isOssDeployment();
  const bypassLimits = await organizationBypassesPlanLimits(organizationId);

  const historySince = subDays(new Date(), HISTORY_LOOKBACK_DAYS);

  const [
    organization,
    agentCount,
    memberCount,
    handoffTickets,
    supportTickets,
    recentConversations,
    teamMembers,
    currentUser
  ] = await Promise.all([
    prisma.organization.findFirst({
      where: { id: organizationId },
      select: {
        tier: true,
        includedMessages: true,
        polarCustomerId: true,
        humanDeskEnabled: true
      }
    }),
    oss
      ? Promise.resolve(0)
      : prisma.agent.count({ where: { organizationId } }),
    oss ? Promise.resolve(0) : prisma.user.count({ where: { organizationId } }),
    prisma.handoffTicket.findMany({
      where: {
        organizationId,
        status: { in: ['OPEN', 'IN_PROGRESS'] }
      },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        summary: true,
        note: true,
        status: true,
        urgency: true,
        assigneeId: true,
        createdAt: true
      },

      orderBy: { createdAt: 'desc' },
      take: 8
    }),
    // Cloud-only: Humaner support / bug tickets (not Self-Host Helpdesk).
    oss
      ? Promise.resolve([])
      : prisma.supportTicket.findMany({
          where: {
            userId,
            status: { in: ['OPEN', 'IN_PROGRESS'] }
          },
          select: {
            id: true,
            title: true,
            status: true,
            contextTab: true,
            contextFeature: true,
            updatedAt: true
          },
          orderBy: { updatedAt: 'desc' },
          take: 8
        }),
    prisma.conversation.findMany({
      where: {
        updatedAt: { gte: historySince },
        agent: { organizationId }
      },
      select: {
        id: true,
        updatedAt: true,
        agent: { select: { name: true } },
        messages: {
          select: { role: true, unanswered: true, content: true },
          orderBy: { createdAt: 'asc' },
          take: 50
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 40
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
    prisma.user.findFirst({
      where: { id: userId },
      select: { notificationPreferences: true }
    })
  ]);

  const activityPrefs = parseActivityNotificationPreferences(
    currentUser?.notificationPreferences
  );

  if (!organization) {
    return {
      items: [],
      unreadCount: 0,
      teamMembers: [],
      currentUserId: userId
    };
  }

  const tier = normalizeTier(organization.tier);
  const plan = getEffectivePlan(tier, organization.includedMessages);

  // Self-Host: no Polar billing / plan-limit upgrade nudges.
  if (!oss) {
    const messagesUsed = await getMessagesUsedThisMonth(
      session.user.organizationId,
      tier
    );
    const messageQuotaExhausted =
      plan.overagePerMessage === null &&
      plan.includedMessages > 0 &&
      messagesUsed >= plan.includedMessages;

    if (!bypassLimits) {
      const usagePercent =
        plan.includedMessages > 0
          ? Math.round((messagesUsed / plan.includedMessages) * 100)
          : 0;

      if (messageQuotaExhausted || usagePercent >= 100) {
        if (tier === 'free') {
          items.push({
            id: 'billing-free-quota',
            kind: 'billing',
            title: `${plan.name} message quota exhausted`,
            description:
              'Free messages for this period are used up. Upgrade to keep agents responding.',
            href: Routes.Billing,
            severity: 'critical',
            tag: plan.name,
            createdAt: new Date().toISOString()
          });
        } else {
          items.push({
            id: 'plan-messages-critical',
            kind: 'plan_limit',
            title: 'Message limit reached',
            description: `${plan.name} includes ${plan.includedMessages.toLocaleString()} messages/mo. Upgrade or wait for the next billing period.`,
            href: Routes.Billing,
            severity: 'critical',
            tag: `${usagePercent}% used`,
            createdAt: new Date().toISOString()
          });
        }
      } else if (usagePercent >= 80) {
        items.push({
          id: 'plan-messages-warning',
          kind: 'plan_limit',
          title: 'Approaching message limit',
          description: `${messagesUsed.toLocaleString()} of ${plan.includedMessages.toLocaleString()} included messages used this period.`,
          href: Routes.Billing,
          severity: 'warning',
          tag: `${usagePercent}% used`,
          createdAt: new Date().toISOString()
        });
      }

      if (agentCount >= plan.agents) {
        items.push({
          id: 'plan-agents-limit',
          kind: 'plan_limit',
          title: 'Agent limit reached',
          description: `${plan.name} includes ${plan.agents} ${plan.agents === 1 ? 'agent' : 'agents'}. Upgrade to add more.`,
          href: Routes.Billing,
          severity: agentCount > plan.agents ? 'critical' : 'warning',
          tag: `${agentCount}/${plan.agents} agents`,
          createdAt: new Date().toISOString()
        });
      }

      if (memberCount >= plan.members) {
        items.push({
          id: 'plan-members-limit',
          kind: 'plan_limit',
          title: 'Member limit reached',
          description: `${plan.name} includes ${plan.members} ${plan.members === 1 ? 'member' : 'members'}. Upgrade to invite more teammates.`,
          href: Routes.OrganizationTeam,
          severity: memberCount > plan.members ? 'critical' : 'warning',
          tag: `${memberCount}/${plan.members} members`,
          createdAt: new Date().toISOString()
        });
      }
    }

    if (tier !== 'free' && !organization.polarCustomerId) {
      items.push({
        id: 'billing-missing-customer',
        kind: 'billing',
        title: 'Billing setup incomplete',
        description:
          'Your workspace is on a paid plan but billing is not fully connected. Review billing to avoid interruptions.',
        href: Routes.Billing,
        severity: 'warning',
        tag: 'Billing',
        createdAt: new Date().toISOString()
      });
    }
  }

  if (organization.humanDeskEnabled) {
    for (const ticket of handoffTickets) {
      if (!shouldNotifyDeskInApp(activityPrefs, ticket.urgency)) {
        continue;
      }
      const customerRequest =
        ticket.note?.trim() || ticket.summary?.trim() || ticket.subject;
      items.push({
        id: `human-desk-${ticket.id}`,
        kind: 'human_desk',
        title: ticket.subject,
        description: customerRequest,
        tag: formatTicketRef(ticket.ticketNumber),
        href: Routes.DeskHuman,
        severity:
          ticket.urgency === 'HIGH'
            ? 'critical'
            : ticket.status === 'OPEN'
              ? 'warning'
              : 'info',
        createdAt: ticket.createdAt.toISOString(),
        handoff: {
          ticketId: ticket.id,
          status: ticket.status as HandoffTicketStatus,
          urgency: ticket.urgency as HandoffTicketUrgency,
          assigneeId: ticket.assigneeId
        }
      });
    }
  }

  for (const ticket of supportTickets) {
    const areaLabel = reportBugTabLabel(ticket.contextTab);
    const featureSuffix = ticket.contextFeature
      ? ` · ${ticket.contextFeature}`
      : '';

    items.push({
      id: `workspace-ticket-${ticket.id}`,
      kind: 'workspace_ticket',
      title: ticket.title,
      description: `Bug report in ${areaLabel}${featureSuffix}`,
      href: Routes.HumanDesk,
      severity: ticket.status === 'OPEN' ? 'warning' : 'info',
      tag: `${supportTicketStatusLabel(ticket.status)} · Bug report`,
      createdAt: ticket.updatedAt.toISOString(),
      action: 'open_support_tickets'
    });
  }

  const conversationHighlights =
    detectConversationHighlights(recentConversations);

  for (const highlight of conversationHighlights) {
    items.push({
      id: highlight.id,
      kind: 'history_highlight',
      title: highlight.title,
      description: highlight.description,
      href: Routes.History,
      severity: highlight.severity,
      tag: highlight.tag,
      createdAt: highlight.createdAt
    });
  }

  const sorted = sortNotifications(items).slice(0, 24);

  return {
    items: sorted,
    unreadCount: sorted.length,
    teamMembers: teamMembers.map((membership) => ({
      id: membership.user.id,
      name: membership.user.name,
      image: membership.user.image,
      email: membership.user.email
    })),
    currentUserId: userId
  };
}
