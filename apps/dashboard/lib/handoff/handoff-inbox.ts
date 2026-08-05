import type {
  HandoffTicketSource,
  HandoffTicketStatus,
  HandoffTicketUrgency
} from '@/types/handoff-ticket';

export type HandoffInboxAssignee = {
  id: string;
  name: string;
  image: string | null;
  email: string | null;
};

export type HandoffInboxTicket = {
  id: string;
  ticketNumber: number;
  agentId: string;
  agentName: string;
  /** Escalation SLA target in minutes for this ticket's urgency (business hours). */
  slaMinutes: number | null;
  visitorEmail: string | null;
  visitorFirstName: string | null;
  visitorLastName: string | null;
  visitorCompany: string | null;
  visitorLeftAt: string | null;
  subject: string;
  summary: string;
  whySummary: string | null;
  howSummary: string | null;
  transcript: string;
  note: string | null;
  source: HandoffTicketSource;
  status: HandoffTicketStatus;
  urgency: HandoffTicketUrgency;
  routedTo: 'ai' | 'human' | null;
  clusterId: string | null;
  runbookId: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolvedByName: string | null;
  resolutionSolution: string | null;
  loopStatus:
    | 'SOLVING'
    | 'DRAFT_READY'
    | 'APPROVED'
    | 'REJECTED'
    | 'FAILED'
    | null;
  draftSolution: string | null;
  loopSolvedAt: string | null;
  loopError: string | null;
  liveChatTimedOut: boolean;
  assignee: HandoffInboxAssignee | null;
  assignedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HandoffInboxStatusFilter =
  | 'active'
  | 'all'
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';

export type HandoffInboxAssignmentFilter =
  | 'all'
  | 'unassigned'
  | 'mine'
  | 'others';

export type HandoffInboxUrgencyFilter = 'all' | HandoffTicketUrgency;

export const URGENCY_LABELS: Record<HandoffTicketUrgency, string> = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

const URGENCY_RANK: Record<HandoffTicketUrgency, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2
};

const ACTIVE_STATUSES = new Set<HandoffTicketStatus>(['OPEN', 'IN_PROGRESS']);

export function filterHandoffInboxTickets(
  tickets: HandoffInboxTicket[],
  input: {
    query: string;
    statusFilter: HandoffInboxStatusFilter;
    assignmentFilter: HandoffInboxAssignmentFilter;
    urgencyFilter: HandoffInboxUrgencyFilter;
    currentUserId: string;
  }
): HandoffInboxTicket[] {
  const normalizedQuery = input.query.trim().toLowerCase();

  return tickets.filter((ticket) => {
    if (input.statusFilter === 'active') {
      if (!ACTIVE_STATUSES.has(ticket.status)) {
        return false;
      }
    } else if (
      input.statusFilter !== 'all' &&
      ticket.status !== input.statusFilter
    ) {
      return false;
    }

    if (
      input.urgencyFilter !== 'all' &&
      ticket.urgency !== input.urgencyFilter
    ) {
      return false;
    }

    if (input.assignmentFilter === 'unassigned' && ticket.assignee) {
      return false;
    }
    if (
      input.assignmentFilter === 'mine' &&
      ticket.assignee?.id !== input.currentUserId
    ) {
      return false;
    }
    if (
      input.assignmentFilter === 'others' &&
      (!ticket.assignee || ticket.assignee.id === input.currentUserId)
    ) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      String(ticket.ticketNumber),
      `#${String(ticket.ticketNumber).padStart(5, '0')}`,
      ticket.subject,
      ticket.summary,
      ticket.visitorEmail ?? '',
      ticket.agentName,
      ticket.assignee?.name ?? '',
      ticket.assignee?.email ?? ''
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

const STATUS_SORT_RANK: Record<HandoffTicketStatus, number> = {
  OPEN: 0,
  IN_PROGRESS: 1,
  RESOLVED: 2,
  CLOSED: 3
};

export function sortHandoffInboxTickets(
  tickets: HandoffInboxTicket[]
): HandoffInboxTicket[] {
  return [...tickets].sort((left, right) => {
    const statusDiff =
      STATUS_SORT_RANK[left.status] - STATUS_SORT_RANK[right.status];
    if (statusDiff !== 0) {
      return statusDiff;
    }

    const leftUnassigned = left.assignee ? 1 : 0;
    const rightUnassigned = right.assignee ? 1 : 0;
    if (leftUnassigned !== rightUnassigned) {
      return leftUnassigned - rightUnassigned;
    }

    const urgencyDiff =
      URGENCY_RANK[left.urgency] - URGENCY_RANK[right.urgency];
    if (urgencyDiff !== 0) {
      return urgencyDiff;
    }

    return (
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );
  });
}

export function countHandoffInboxTickets(
  tickets: HandoffInboxTicket[],
  currentUserId: string
): {
  active: number;
  unassigned: number;
  mine: number;
} {
  const activeTickets = tickets.filter((ticket) =>
    ACTIVE_STATUSES.has(ticket.status)
  );

  return {
    active: activeTickets.length,
    unassigned: activeTickets.filter((ticket) => !ticket.assignee).length,
    mine: activeTickets.filter(
      (ticket) => ticket.assignee?.id === currentUserId
    ).length
  };
}
