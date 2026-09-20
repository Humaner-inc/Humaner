import { Routes } from '@/constants/routes';
import { formatTicketRef } from '@/lib/desk/ticket-ref';
import { toPublicPathname } from '@/lib/routes/public-pathname';
import {
  COMPANION_TASK_PROPOSAL_CANDIDATE_LIMIT,
  COMPANION_TASK_PROPOSAL_LIMIT,
  type CompanionTaskProposal
} from '@/types/companion-task-proposal';
import type { DashboardNotification } from '@/types/dashboard-notification';

const LABEL_MAX = 28;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const SKIP_NOTIFICATION_KINDS = new Set(['api_key', 'billing', 'loop']);

export function truncateProposalLabel(value: string, max = LABEL_MAX): string {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

export function threadIdFromHref(href: string | undefined): string | null {
  if (!href) return null;
  try {
    const url = new URL(href, 'https://app.humaner.io');
    const fromQuery = url.searchParams.get('thread');
    if (fromQuery) return fromQuery;
  } catch {
    // relative path without a host still parses with the base above
  }
  const match = href.match(/\/inbox\/threads\/([^/?#]+)/);
  return match?.[1] ?? null;
}

function contextBoost(
  kind: CompanionTaskProposal['kind'],
  pathname: string | undefined
): number {
  if (!pathname) return 0;
  const path = toPublicPathname(pathname);
  if (
    path.startsWith(Routes.Inbox) &&
    (kind === 'mail' || kind === 'mention')
  ) {
    return 22;
  }
  if (
    (path.startsWith(Routes.Tasks) || path.startsWith('/tasks')) &&
    kind === 'task'
  ) {
    return 22;
  }
  if (path.startsWith(Routes.Calendar) && kind === 'calendar') {
    return 22;
  }
  if (
    (path.startsWith(Routes.Desk) || path.startsWith(Routes.HumanDesk)) &&
    (kind === 'task' || kind === 'ticket')
  ) {
    return 22;
  }
  return 0;
}

export function proposalFromNotification(
  notification: DashboardNotification
): CompanionTaskProposal | null {
  if (SKIP_NOTIFICATION_KINDS.has(notification.kind)) {
    return null;
  }

  const threadId = threadIdFromHref(notification.href);
  const title = notification.title.trim() || 'Untitled';
  const createdAt = notification.createdAt;

  if (notification.kind === 'mail') {
    const from = notification.emphasis?.trim();
    return {
      id: `mail-${threadId ?? notification.id}`,
      kind: 'mail',
      label: title,
      prompt: threadId
        ? `Draft a reply for inbox thread ${threadId} (“${title}”${from ? ` from ${from}` : ''}). Read the thread and write a send-ready draft.`
        : `Draft a reply for unread mail “${title}”${from ? ` from ${from}` : ''}. Find the thread and write a send-ready draft.`,
      href: notification.href,
      notificationId: notification.id,
      resourceId: threadId ?? notification.id,
      createdAt,
      score: notification.severity === 'critical' ? 78 : 72
    };
  }

  if (notification.kind === 'mention') {
    return {
      id: `mention-${notification.id}`,
      kind: 'mention',
      label: title,
      prompt: `I was mentioned: “${title}”. ${notification.description} Help me respond.`,
      href: notification.href,
      notificationId: notification.id,
      resourceId: threadId ?? notification.id,
      createdAt,
      score: 100
    };
  }

  if (notification.kind === 'task') {
    const ref = notification.emphasis?.trim();
    return {
      id: `task-${notification.id}`,
      kind: 'task',
      label: title,
      prompt: `Help me finish the assigned work “${title}”${ref ? ` (${ref})` : ''}. What’s outstanding and what should I do next?`,
      href: notification.href,
      notificationId: notification.id,
      resourceId: notification.id,
      createdAt,
      score: 90
    };
  }

  if (notification.kind === 'ticket') {
    return {
      id: `ticket-${notification.id}`,
      kind: 'ticket',
      label: title,
      prompt: `Help me triage the open ticket “${title}”${notification.emphasis ? ` [${notification.emphasis}]` : ''}. Summarize and suggest the next step.`,
      href: notification.href,
      notificationId: notification.id,
      resourceId: notification.id,
      createdAt,
      score: 55
    };
  }

  return null;
}

export function proposalFromAssignedTask(input: {
  id: string;
  ticketNumber: number;
  subject: string;
  status: string;
  updatedAt: string;
}): CompanionTaskProposal {
  const ref = formatTicketRef(input.ticketNumber);
  const title = input.subject.trim() || ref;
  return {
    id: `workspace-task-${input.id}`,
    kind: 'task',
    label: title,
    prompt: `Help me work through assigned task ${ref} “${title}”. Status is ${input.status.toLowerCase()}. What’s left and what should I do next?`,
    href: Routes.Tasks,
    resourceId: input.id,
    createdAt: input.updatedAt,
    score: input.status === 'IN_PROGRESS' ? 94 : 90
  };
}

export function proposalFromCalendarEvent(
  input: {
    id: string;
    title: string;
    startsAt: string;
  },
  now = new Date()
): CompanionTaskProposal {
  const title = input.title.trim() || 'Event';
  const startsAt = new Date(input.startsAt);
  const delta = startsAt.getTime() - now.getTime();
  const soon = delta >= 0 && delta <= TWO_HOURS_MS;
  return {
    id: `calendar-${input.id}`,
    kind: 'calendar',
    label: title,
    prompt: `Prep me for calendar event “${title}”. Summarize related mail or tasks if you find them.`,
    href: Routes.Calendar,
    resourceId: input.id,
    createdAt: input.startsAt,
    startsAt: input.startsAt,
    score: soon ? 88 : 60
  };
}

function dedupeKey(proposal: CompanionTaskProposal): string {
  if (proposal.kind === 'calendar') {
    return `calendar:${proposal.resourceId ?? proposal.id}`;
  }
  if (proposal.kind === 'mail') {
    return `mail:${proposal.resourceId ?? proposal.label.toLowerCase()}`;
  }
  return `${proposal.kind}:${proposal.label.toLowerCase()}`;
}

export function pickCompanionTaskProposals(
  candidates: CompanionTaskProposal[],
  options?: {
    pathname?: string;
    dismissedNotificationIds?: Iterable<string>;
    now?: Date;
    limit?: number;
  }
): CompanionTaskProposal[] {
  const limit = options?.limit ?? COMPANION_TASK_PROPOSAL_LIMIT;
  const dismissed = new Set(options?.dismissedNotificationIds ?? []);
  const now = options?.now ?? new Date();
  const pathname = options?.pathname;

  const ranked = candidates
    .filter(
      (proposal) =>
        !proposal.notificationId || !dismissed.has(proposal.notificationId)
    )
    .map((proposal) => {
      let score = proposal.score + contextBoost(proposal.kind, pathname);
      if (proposal.startsAt) {
        const delta = new Date(proposal.startsAt).getTime() - now.getTime();
        if (delta >= 0 && delta <= TWO_HOURS_MS) {
          score = Math.max(score, 88 + contextBoost(proposal.kind, pathname));
        }
      }
      return { ...proposal, score };
    })
    .toSorted((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
    });

  const seen = new Set<string>();
  const picked: CompanionTaskProposal[] = [];
  for (const proposal of ranked) {
    const key = dedupeKey(proposal);
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(proposal);
    if (picked.length >= limit) break;
  }
  return picked;
}

export function collectCompanionTaskProposals(
  input: {
    notifications: DashboardNotification[];
    tasks?: Array<{
      id: string;
      ticketNumber: number;
      subject: string;
      status: string;
      updatedAt: string;
    }>;
    events?: Array<{
      id: string;
      title: string;
      startsAt: string;
    }>;
  },
  options?: {
    pathname?: string;
    dismissedNotificationIds?: Iterable<string>;
    now?: Date;
    limit?: number;
  }
): CompanionTaskProposal[] {
  const now = options?.now ?? new Date();
  const fromNotifications = input.notifications
    .map(proposalFromNotification)
    .filter((item): item is CompanionTaskProposal => item !== null);
  const fromTasks = (input.tasks ?? []).map(proposalFromAssignedTask);
  const fromEvents = (input.events ?? []).map((event) =>
    proposalFromCalendarEvent(event, now)
  );

  return pickCompanionTaskProposals(
    [...fromNotifications, ...fromTasks, ...fromEvents],
    {
      ...options,
      now,
      limit: options?.limit ?? COMPANION_TASK_PROPOSAL_CANDIDATE_LIMIT
    }
  );
}

export function formatProposalButtonLabel(
  proposal: CompanionTaskProposal,
  now = new Date()
): string {
  if (proposal.kind === 'calendar' && proposal.startsAt) {
    const startsAt = new Date(proposal.startsAt);
    if (!Number.isNaN(startsAt.getTime())) {
      const time = startsAt.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
      });
      const sameDay =
        startsAt.toDateString() === now.toDateString()
          ? time
          : startsAt.toLocaleDateString([], {
              month: 'short',
              day: 'numeric'
            });
      return truncateProposalLabel(`${sameDay} · ${proposal.label}`, 32);
    }
  }
  return truncateProposalLabel(proposal.label);
}
