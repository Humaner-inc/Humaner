import 'server-only';

import { redirect } from 'next/navigation';
import {
  formatCreditUsd,
  isCreditsBillingModel
} from '@humaner/shared/credits';
import { getEffectivePlan } from '@humaner/shared/plans';
import { addDays, formatDistanceToNow } from 'date-fns';

import { inboxThreadRoute } from '@/constants/inbox-nav-items';
import { Routes } from '@/constants/routes';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { creditUsageForAccount } from '@/lib/billing/credit-usage';
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
  shouldNotifyDeskInApp,
  shouldNotifyMailInApp
} from '@/lib/notifications/activity-notification-preferences';
import { getDemoDashboardNotifications } from '@/lib/notifications/demo-dashboard-notifications';
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
    memberCount,
    handoffTickets,
    expiringApiKeys,
    teamMembers,
    currentUser,
    mailScope,
    mentionRows
  ] = await Promise.all([
    prisma.organization.findFirst({
      where: { id: organizationId },
      select: {
        tier: true,
        includedMessages: true,
        billingModel: true,
        creditBalanceCents: true,
        humanDeskEnabled: true,
        owner: {
          select: { billingModel: true, creditBalanceCents: true }
        }
      }
    }),
    prisma.user.count({ where: { organizationId } }),
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
      : resolveMailAliasScope({ userId, organizationId }),
    prisma.notification.findMany({
      where: { userId, dismissed: false },
      orderBy: { createdAt: 'desc' },
      take: GROUP_LIMIT,
      select: {
        id: true,
        subject: true,
        content: true,
        link: true,
        createdAt: true
      }
    })
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

  const [messagesUsed, inboxMail, assignedMail] = await Promise.all([
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
            folder: 'INBOX',
            status: { in: ['OPEN', 'PENDING'] },
            aliasId: aliasIdFilter(mailScope)
          },
          select: {
            id: true,
            subject: true,
            lastMessageAt: true,
            tags: { select: { tagId: true } },
            messages: {
              where: { direction: 'INBOUND' },
              orderBy: { sentAt: 'desc' },
              take: 1,
              select: { fromAddress: true }
            }
          },
          orderBy: { lastMessageAt: 'desc' },
          take: GROUP_LIMIT
        }),
    oss || !mailScope
      ? Promise.resolve([])
      : prisma.mailThread.findMany({
          where: {
            organizationId,
            assigneeId: userId,
            archivedAt: null,
            folder: { in: ['INBOX', 'SENT'] },
            status: { in: ['OPEN', 'PENDING'] }
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
    const credits = creditUsageForAccount(organization, {
      messagesUsed,
      includedMessages: plan.includedMessages
    });
    const creditsUsedCents = credits.usedCents;
    const creditsRemainingCents = credits.remainingCents;
    const messageQuotaExhausted = isCreditsBillingModel(
      organization.owner?.billingModel ?? organization.billingModel
    )
      ? credits.exhausted
      : plan.overagePerMessage === null && credits.exhausted;

    if (!bypassLimits) {
      const usagePercent = credits.usagePercent;

      if (messageQuotaExhausted || usagePercent >= 100) {
        if (
          tier === 'free' &&
          !isCreditsBillingModel(organization.billingModel)
        ) {
          items.push({
            id: 'billing-free-quota',
            kind: 'billing',
            title: `${plan.name} message quota`,
            emphasis: 'exhausted',
            description:
              'Free messages for this period are used up. Upgrade to keep Companion running.',
            href: Routes.Billing,
            severity: 'critical',
            createdAt: now.toISOString()
          });
        } else {
          items.push({
            id: 'plan-credits-critical',
            kind: 'billing',
            title: 'Credits used up',
            emphasis: formatCreditUsd(0),
            description: `${formatCreditUsd(creditsUsedCents)} used this period. Add credits to keep Companion running.`,
            href: Routes.Billing,
            severity: 'critical',
            createdAt: now.toISOString()
          });
        }
      } else if (usagePercent >= 80) {
        items.push({
          id: 'plan-credits-warning',
          kind: 'billing',
          title: 'Credits running low',
          emphasis: `${formatCreditUsd(creditsRemainingCents)} left`,
          description: `${formatCreditUsd(creditsUsedCents)} used this period. Add credits or turn on auto-reload.`,
          href: Routes.Billing,
          severity: 'warning',
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
  }

  let ticketCount = 0;
  let taskCount = 0;
  let loopCount = 0;

  for (const ticket of oss ? handoffTickets : []) {
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

  for (const thread of inboxMail) {
    const tagMatch =
      activityPrefs.mail.tagIds.length === 0
        ? shouldNotifyMailInApp(activityPrefs, null)
        : thread.tags.some((tag) =>
            shouldNotifyMailInApp(activityPrefs, tag.tagId)
          );
    if (!tagMatch) {
      continue;
    }
    const from = thread.messages[0]?.fromAddress;
    items.push({
      id: `mail-${thread.id}`,
      kind: 'mail',
      title: thread.subject || '(no subject)',
      emphasis: from,
      description: from ? `Unread from ${from}` : 'Unread',
      href: inboxThreadRoute(thread.id),
      severity: 'info',
      createdAt: thread.lastMessageAt.toISOString()
    });
  }

  for (const mention of mentionRows) {
    items.push({
      id: `mention-${mention.id}`,
      kind: 'mention',
      title: mention.subject || 'Mention',
      description: mention.content,
      href: mention.link || Routes.TeamPanel,
      severity: 'info',
      createdAt: mention.createdAt.toISOString()
    });
  }

  for (const thread of assignedMail) {
    const from = thread.messages[0]?.fromAddress;
    items.push({
      id: `assigned-mail-${thread.id}`,
      kind: 'task',
      title: thread.subject || '(no subject)',
      emphasis: from,
      description: 'Assigned to you',
      href: inboxThreadRoute(thread.id),
      severity: 'warning',
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
