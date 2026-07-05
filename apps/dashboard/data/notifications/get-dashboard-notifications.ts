import 'server-only';

import { getPlanForTier } from '@humaner/shared/plans';
import { subDays } from 'date-fns';
import { redirect } from 'next/navigation';

import { Routes } from '@/constants/routes';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { organizationBypassesPlanLimits } from '@/lib/billing/plan-limits';
import { getMessagesUsedThisMonth } from '@/lib/billing/message-usage';
import { normalizeTier } from '@/lib/billing/tier';
import { prisma } from '@/lib/db/prisma';
import { detectConversationHighlights } from '@/lib/notifications/conversation-highlights';
import { reportBugTabLabel } from '@/lib/report-bug-context-options';
import { supportTicketStatusLabel } from '@/lib/support-ticket-labels';
import type {
  DashboardNotification,
  DashboardNotificationsSnapshot
} from '@/types/dashboard-notification';

const HISTORY_LOOKBACK_DAYS = 14;

const HANDOFF_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed'
};

const HANDOFF_URGENCY_LABELS: Record<string, string> = {
  LOW: 'Low urgency',
  MEDIUM: 'Medium urgency',
  HIGH: 'High urgency'
};

function severityRank(
  severity: DashboardNotification['severity']
): number {
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
  const bypassLimits = await organizationBypassesPlanLimits(organizationId);

  const historySince = subDays(new Date(), HISTORY_LOOKBACK_DAYS);

  const [
    organization,
    agentCount,
    memberCount,
    handoffTickets,
    supportTickets,
    recentConversations
  ] = await Promise.all([
    prisma.organization.findFirst({
      where: { id: organizationId },
      select: { tier: true, polarCustomerId: true, humanDeskEnabled: true }
    }),
    prisma.agent.count({ where: { organizationId } }),
    prisma.user.count({ where: { organizationId } }),
    prisma.handoffTicket.findMany({
      where: {
        organizationId,
        status: { in: ['OPEN', 'IN_PROGRESS'] }
      },
      select: {
        id: true,
        subject: true,
        summary: true,
        status: true,
        urgency: true,
        createdAt: true,
        agent: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 8
    }),
    prisma.supportTicket.findMany({
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
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 40
    })
  ]);

  if (!organization) {
    return { items: [], unreadCount: 0 };
  }

  const tier = normalizeTier(organization.tier);
  const plan = getPlanForTier(tier);
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
        href: Routes.Members,
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
      description: 'Your workspace is on a paid plan but billing is not fully connected. Review billing to avoid interruptions.',
      href: Routes.Billing,
      severity: 'warning',
      tag: 'Billing',
      createdAt: new Date().toISOString()
    });
  }

  if (organization.humanDeskEnabled) {
    for (const ticket of handoffTickets) {
    const statusLabel =
      HANDOFF_STATUS_LABELS[ticket.status] ?? ticket.status;
    const urgencyLabel =
      HANDOFF_URGENCY_LABELS[ticket.urgency] ?? ticket.urgency;

    items.push({
      id: `human-desk-${ticket.id}`,
      kind: 'human_desk',
      title: ticket.subject,
      description: `${ticket.agent.name} · ${ticket.summary}`,
      href: Routes.HumanDesk,
      severity:
        ticket.urgency === 'HIGH'
          ? 'critical'
          : ticket.status === 'OPEN'
            ? 'warning'
            : 'info',
      tag: `${statusLabel} · ${urgencyLabel}`,
      createdAt: ticket.createdAt.toISOString()
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

  const conversationHighlights = detectConversationHighlights(recentConversations);

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
    unreadCount: sorted.length
  };
}
