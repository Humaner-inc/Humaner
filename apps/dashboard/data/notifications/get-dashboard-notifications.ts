import 'server-only';

import { redirect } from 'next/navigation';
import { getEffectivePlan } from '@humaner/shared/plans';
import { addDays, formatDistanceToNow } from 'date-fns';

import { inboxThreadRoute } from '@/constants/inbox-nav-items';
import { Routes } from '@/constants/routes';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { getMessagesUsedThisMonth } from '@/lib/billing/message-usage';
import { organizationBypassesPlanLimits } from '@/lib/billing/plan-limits';
import { normalizeTier } from '@/lib/billing/tier';
import { prisma } from '@/lib/db/prisma';
import { isLocalDemo } from '@/lib/demo/is-local-demo';
import { isOssDeployment } from '@/lib/deployment-mode';
import { formatTicketRef } from '@/lib/desk/ticket-ref';
import {
  aliasIdFilter,
  resolveMailAliasScope
} from '@/lib/inbox/mail-alias-scope';
import {
  parseActivityNotificationPreferences,
  shouldNotifyDeskInApp
} from '@/lib/notifications/activity-notification-preferences';
import { getDemoDashboardNotifications } from '@/lib/notifications/demo-dashboard-notifications';
import { reportBugTabLabel } from '@/lib/report-bug-context-options';
import type {
  DashboardNotification,
  DashboardNotificationsSnapshot
} from '@/types/dashboard-notification';
import type {
  HandoffTicketStatus,
  HandoffTicketUrgency
} from '@/types/handoff-ticket';

const GROUP_LIMIT = 6;
const API_KEY_REMINDER_DAYS = 14;
const LOOP_ACTIONABLE = new Set(['DRAFT_READY', 'FAILED']);

function urgencyLabel(urgency: string): string {
  switch (urgency) {
    case 'HIGH':
      return 'high';
    case 'MEDIUM':
      return 'medium';
    case 'LOW':
      return 'low';
    default:
      return urgency.toLowerCase();
  }
}

function ticketSeverity(
  urgency: string,
  status: string
): DashboardNotification['severity'] {
  if (urgency === 'HIGH') return 'critical';
  if (status === 'OPEN') return 'warning';
  return 'info';
}

export async function getDashboardNotifications(): Promise<DashboardNotificationsSnapshot> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const organizationId = session.user.organizationId;
  const userId = session.user.id;

  if (isLocalDemo()) {
    return getDemoDashboardNotifications(userId);
  }

  const items: DashboardNotification[] = [];
  const oss = isOssDeployment();
  const bypassLimits = await organizationBypassesPlanLimits(organizationId);
  const now = new Date();

  const [
    organization,
    agentCount,
    memberCount,
    handoffTickets,
    supportTickets,
    expiringApiKeys,
    teamMembers,
    currentUser,
    mailScope
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
        loopStatus: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 32
    }),
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
          take: GROUP_LIMIT
        }),
    prisma.apiKey.findMany({
      where: {
        organizationId,
        expiresAt: {
          lte: addDays(now, API_KEY_REMINDER_DAYS)
        }
      },
      select: {
        id: true,
        description: true,
        expiresAt: true
      },
      orderBy: { expiresAt: 'asc' },
      take: GROUP_LIMIT
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
    }),
    oss
      ? Promise.resolve(null)
      : resolveMailAliasScope({ userId, organizationId })
  ]);

  if (!organization) {
    return {
      items: [],
      unreadCount: 0,
      teamMembers: [],
      currentUserId: userId
    };
  }

  const activityPrefs = parseActivityNotificationPreferences(
    currentUser?.notificationPreferences
  );
  const tier = normalizeTier(organization.tier);
  const plan = getEffectivePlan(tier, organization.includedMessages);

  const [messagesUsed, urgentMail] = await Promise.all([
    oss
      ? Promise.resolve(0)
      : getMessagesUsedThisMonth(session.user.organizationId, tier),
    oss || !mailScope
      ? Promise.resolve([])
      : prisma.mailThread.findMany({
          where: {
            organizationId,
            isUnread: true,
            archivedAt: null,
            status: { in: ['OPEN', 'PENDING'] },
            aliasId: aliasIdFilter(mailScope),
            handoffTicket: { urgency: 'HIGH' }
          },
          select: {
            id: true,
            subject: true,
            lastMessageAt: true,
            messages: {
              where: { direction: 'INBOUND' },
              orderBy: { sentAt: 'desc' },
              take: 1,
              select: { fromAddress: true }
            }
          },
          orderBy: { lastMessageAt: 'desc' },
          take: GROUP_LIMIT
        })
  ]);

  if (!oss) {
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
            title: `${plan.name} message quota`,
            emphasis: 'exhausted',
            description:
              'Free messages for this period are used up. Upgrade to keep agents responding.',
            href: Routes.Billing,
            severity: 'critical',
            createdAt: now.toISOString()
          });
        } else {
          items.push({
            id: 'plan-messages-critical',
            kind: 'billing',
            title: 'Message limit reached',
            emphasis: `${usagePercent}% used`,
            description: `${plan.name} includes ${plan.includedMessages.toLocaleString()} messages/mo. Upgrade or wait for the next billing period.`,
            href: Routes.Billing,
            severity: 'critical',
            createdAt: now.toISOString()
          });
        }
      } else if (usagePercent >= 80) {
        items.push({
          id: 'plan-messages-warning',
          kind: 'billing',
          title: 'Approaching message limit',
          emphasis: `${usagePercent}% used`,
          description: `${messagesUsed.toLocaleString()} of ${plan.includedMessages.toLocaleString()} included messages used this period.`,
          href: Routes.Billing,
          severity: 'warning',
          createdAt: now.toISOString()
        });
      }

      if (agentCount >= plan.agents) {
        items.push({
          id: 'plan-agents-limit',
          kind: 'billing',
          title: 'Agent limit reached',
          emphasis: `${agentCount}/${plan.agents} agents`,
          description: `${plan.name} includes ${plan.agents} ${plan.agents === 1 ? 'agent' : 'agents'}. Upgrade to add more.`,
          href: Routes.Billing,
          severity: agentCount > plan.agents ? 'critical' : 'warning',
          createdAt: now.toISOString()
        });
      }

      if (memberCount >= plan.members) {
        items.push({
          id: 'plan-members-limit',
          kind: 'billing',
          title: 'Member limit reached',
          emphasis: `${memberCount}/${plan.members} members`,
          description: `${plan.name} includes ${plan.members} ${plan.members === 1 ? 'member' : 'members'}. Upgrade to invite more teammates.`,
          href: Routes.OrganizationTeam,
          severity: memberCount > plan.members ? 'critical' : 'warning',
          createdAt: now.toISOString()
        });
      }
    }

    if (tier !== 'free' && !organization.polarCustomerId) {
      items.push({
        id: 'billing-missing-customer',
        kind: 'billing',
        title: 'Billing setup',
        emphasis: 'incomplete',
        description:
          'Your workspace is on a paid plan but billing is not fully connected. Review billing to avoid interruptions.',
        href: Routes.Billing,
        severity: 'warning',
        createdAt: now.toISOString()
      });
    }
  }

  let ticketCount = 0;
  let taskCount = 0;
  let loopCount = 0;

  for (const ticket of handoffTickets) {
    const ref = formatTicketRef(ticket.ticketNumber);
    const loopStatus = ticket.loopStatus;
    const isLoopActionable =
      typeof loopStatus === 'string' && LOOP_ACTIONABLE.has(loopStatus);

    if (isLoopActionable && loopCount < GROUP_LIMIT) {
      loopCount += 1;
      const failed = loopStatus === 'FAILED';
      items.push({
        id: `loop-${ticket.id}`,
        kind: 'loop',
        title: failed ? 'Loop failed' : 'Draft ready',
        emphasis: ref,
        description: ticket.subject,
        href: Routes.DeskAgent,
        severity: failed ? 'critical' : 'warning',
        createdAt: ticket.createdAt.toISOString()
      });
      continue;
    }

    if (!organization.humanDeskEnabled) {
      continue;
    }

    const handoff = {
      ticketId: ticket.id,
      status: ticket.status as HandoffTicketStatus,
      urgency: ticket.urgency as HandoffTicketUrgency,
      assigneeId: ticket.assigneeId
    };

    if (ticket.assigneeId === userId && taskCount < GROUP_LIMIT) {
      taskCount += 1;
      items.push({
        id: `task-${ticket.id}`,
        kind: 'task',
        title: ticket.subject,
        emphasis: ref,
        description:
          ticket.note?.trim() || ticket.summary?.trim() || ticket.subject,
        href: Routes.DeskHuman,
        severity: ticketSeverity(ticket.urgency, ticket.status),
        createdAt: ticket.createdAt.toISOString(),
        handoff
      });
      continue;
    }

    if (
      ticket.assigneeId ||
      !shouldNotifyDeskInApp(activityPrefs, ticket.urgency) ||
      ticketCount >= GROUP_LIMIT
    ) {
      continue;
    }

    ticketCount += 1;
    items.push({
      id: `ticket-${ticket.id}`,
      kind: 'ticket',
      title: ticket.subject,
      emphasis: urgencyLabel(ticket.urgency),
      description:
        ticket.note?.trim() || ticket.summary?.trim() || ticket.subject,
      href: Routes.DeskHuman,
      severity: ticketSeverity(ticket.urgency, ticket.status),
      createdAt: ticket.createdAt.toISOString(),
      handoff
    });
  }

  for (const ticket of supportTickets) {
    const areaLabel = reportBugTabLabel(ticket.contextTab);
    const featureSuffix = ticket.contextFeature
      ? ` · ${ticket.contextFeature}`
      : '';

    items.push({
      id: `workspace-ticket-${ticket.id}`,
      kind: 'ticket',
      title: ticket.title,
      emphasis: areaLabel,
      description: `Bug report in ${areaLabel}${featureSuffix}`,
      href: Routes.HumanDesk,
      severity: ticket.status === 'OPEN' ? 'warning' : 'info',
      createdAt: ticket.updatedAt.toISOString(),
      action: 'open_support_tickets'
    });
  }

  for (const thread of urgentMail) {
    const from = thread.messages[0]?.fromAddress;
    items.push({
      id: `mail-${thread.id}`,
      kind: 'mail',
      title: from ? `${thread.subject} from` : thread.subject,
      emphasis: from,
      description: thread.subject,
      href: inboxThreadRoute(thread.id),
      severity: 'critical',
      createdAt: thread.lastMessageAt.toISOString()
    });
  }

  for (const apiKey of expiringApiKeys) {
    if (!apiKey.expiresAt) continue;
    const expired = apiKey.expiresAt.getTime() <= now.getTime();
    items.push({
      id: `api-key-${apiKey.id}`,
      kind: 'api_key',
      title: expired ? apiKey.description : `${apiKey.description} expires`,
      emphasis: expired
        ? 'expired'
        : formatDistanceToNow(apiKey.expiresAt, { addSuffix: true }),
      description: expired
        ? `${apiKey.description} has expired.`
        : `${apiKey.description} expires ${formatDistanceToNow(apiKey.expiresAt, { addSuffix: true })}.`,
      href: Routes.Developers,
      severity: expired ? 'critical' : 'warning',
      createdAt: apiKey.expiresAt.toISOString()
    });
  }

  return {
    items,
    unreadCount: items.length,
    teamMembers: teamMembers.map((membership) => ({
      id: membership.user.id,
      name: membership.user.name,
      image: membership.user.image,
      email: membership.user.email
    })),
    currentUserId: userId
  };
}
