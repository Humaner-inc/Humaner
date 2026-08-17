import type {
  DeskIssueOverviewItem,
  DeskIssuesOverview,
  DeskOverviewAssignee
} from '@/data/desk/get-desk-issues-overview';
import type {
  HandoffTeamMember,
  HandoffTicketItem
} from '@/data/handoff/get-handoff-tickets';
import type {
  HandoffTicketStatus,
  HandoffTicketUrgency
} from '@/types/handoff-ticket';

const DEMO_AGENT_ID = '00000000-0000-4000-8000-00000000a001';
const DEMO_AGENT_NAME = 'Support';

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function assigneeFor(
  teamMembers: HandoffTeamMember[],
  currentUserId: string,
  who: 'me' | 'other' | null
): HandoffTeamMember | null {
  if (who === 'me') {
    return (
      teamMembers.find((member) => member.id === currentUserId) ??
      teamMembers[0] ??
      null
    );
  }
  if (who === 'other') {
    return teamMembers.find((member) => member.id !== currentUserId) ?? null;
  }
  return null;
}

function ticket(input: {
  n: number;
  subject: string;
  summary: string;
  status: HandoffTicketStatus;
  urgency: HandoffTicketUrgency;
  routedTo: 'ai' | 'human';
  hoursAgo: number;
  assignee: HandoffTeamMember | null;
  visitorFirstName: string;
  visitorLastName: string;
  visitorEmail: string;
  loopStatus?: HandoffTicketItem['loopStatus'];
  loopError?: string | null;
}): HandoffTicketItem {
  const createdAt = hoursAgo(input.hoursAgo);
  return {
    id: `00000000-0000-4000-8000-00000000t${String(input.n).padStart(3, '0')}`,
    ticketNumber: input.n,
    agentId: DEMO_AGENT_ID,
    agentName: DEMO_AGENT_NAME,
    slaMinutes:
      input.urgency === 'HIGH' ? 15 : input.urgency === 'MEDIUM' ? 120 : 480,
    visitorEmail: input.visitorEmail,
    visitorFirstName: input.visitorFirstName,
    visitorLastName: input.visitorLastName,
    visitorCompany: 'Acme',
    visitorLeftAt: null,
    subject: input.subject,
    summary: input.summary,
    whySummary: null,
    howSummary: null,
    transcript: '',
    note: null,
    source: 'WIDGET',
    status: input.status,
    urgency: input.urgency,
    routedTo: input.routedTo,
    clusterId: null,
    runbookId: null,
    resolvedAt:
      input.status === 'RESOLVED' ? hoursAgo(input.hoursAgo - 1) : null,
    resolvedBy: input.status === 'RESOLVED' ? 'human' : null,
    resolvedByName: input.status === 'RESOLVED' ? 'Alex' : null,
    resolutionSolution: null,
    loopStatus: input.loopStatus ?? null,
    draftSolution: null,
    loopSolvedAt: null,
    loopError: input.loopError ?? null,
    liveChatTimedOut: false,
    assignee: input.assignee,
    assignedAt: input.assignee ? createdAt : null,
    createdAt,
    updatedAt: createdAt
  };
}

export function getDemoHandoffTickets(
  currentUserId: string,
  teamMembers: HandoffTeamMember[]
): HandoffTicketItem[] {
  const me = assigneeFor(teamMembers, currentUserId, 'me');
  const other = assigneeFor(teamMembers, currentUserId, 'other');

  return [
    ticket({
      n: 42,
      subject: 'Password reset',
      summary: 'Visitor cannot sign in after a password reset.',
      status: 'OPEN',
      urgency: 'HIGH',
      routedTo: 'human',
      hoursAgo: 2,
      assignee: null,
      visitorFirstName: 'Maya',
      visitorLastName: 'Chen',
      visitorEmail: 'maya@acme.com'
    }),
    ticket({
      n: 18,
      subject: 'Review VIP escalation',
      summary: 'Enterprise customer asked for a same-day callback.',
      status: 'IN_PROGRESS',
      urgency: 'HIGH',
      routedTo: 'human',
      hoursAgo: 5,
      assignee: me,
      visitorFirstName: 'Jonah',
      visitorLastName: 'Reed',
      visitorEmail: 'jonah@northstar.io'
    }),
    ticket({
      n: 36,
      subject: 'Billing dispute',
      summary: 'Customer asked to review last month’s invoice.',
      status: 'OPEN',
      urgency: 'MEDIUM',
      routedTo: 'human',
      hoursAgo: 8,
      assignee: other,
      visitorFirstName: 'Priya',
      visitorLastName: 'Shah',
      visitorEmail: 'priya@acme.com'
    }),
    ticket({
      n: 29,
      subject: "Can't access workspace",
      summary: 'Teammate invite landed, but the workspace is locked.',
      status: 'OPEN',
      urgency: 'HIGH',
      routedTo: 'human',
      hoursAgo: 11,
      assignee: null,
      visitorFirstName: 'Eli',
      visitorLastName: 'Park',
      visitorEmail: 'eli@acme.com'
    }),
    ticket({
      n: 21,
      subject: 'Follow up on refund',
      summary: 'Waiting on billing to confirm a partial refund.',
      status: 'IN_PROGRESS',
      urgency: 'MEDIUM',
      routedTo: 'human',
      hoursAgo: 16,
      assignee: me,
      visitorFirstName: 'Sofia',
      visitorLastName: 'Martinez',
      visitorEmail: 'sofia@acme.com'
    }),
    ticket({
      n: 14,
      subject: 'API key rotation',
      summary: 'Production key expires in a few days.',
      status: 'RESOLVED',
      urgency: 'LOW',
      routedTo: 'human',
      hoursAgo: 28,
      assignee: me,
      visitorFirstName: 'Noah',
      visitorLastName: 'Kim',
      visitorEmail: 'noah@acme.com'
    }),
    ticket({
      n: 51,
      subject: 'Draft ready for password reset',
      summary: 'Agent Loop drafted a reply for a low-urgency reset.',
      status: 'OPEN',
      urgency: 'LOW',
      routedTo: 'ai',
      hoursAgo: 3,
      assignee: null,
      visitorFirstName: 'Ava',
      visitorLastName: 'Nguyen',
      visitorEmail: 'ava@acme.com',
      loopStatus: 'DRAFT_READY'
    }),
    ticket({
      n: 47,
      subject: 'Loop failed on invoice mismatch',
      summary: 'Agent Loop could not finish this billing ticket.',
      status: 'OPEN',
      urgency: 'LOW',
      routedTo: 'ai',
      hoursAgo: 9,
      assignee: null,
      visitorFirstName: 'Chris',
      visitorLastName: 'Vogel',
      visitorEmail: 'chris@acme.com',
      loopStatus: 'FAILED',
      loopError: 'Missing invoice period in the visitor message.'
    }),
    ticket({
      n: 44,
      subject: 'Auto-solved seat limit question',
      summary: 'Matched the workspace invite loop and sent a reply.',
      status: 'RESOLVED',
      urgency: 'LOW',
      routedTo: 'ai',
      hoursAgo: 20,
      assignee: null,
      visitorFirstName: 'Leah',
      visitorLastName: 'Ortiz',
      visitorEmail: 'leah@acme.com',
      loopStatus: 'APPROVED'
    })
  ];
}

function toOverviewItem(ticket: HandoffTicketItem): DeskIssueOverviewItem {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    status: ticket.status,
    urgency: ticket.urgency,
    visitorEmail: ticket.visitorEmail,
    visitorFirstName: ticket.visitorFirstName,
    visitorLastName: ticket.visitorLastName,
    summary: ticket.summary,
    note: ticket.note,
    agentName: ticket.agentName,
    assigneeId: ticket.assignee?.id ?? null,
    updatedAt: ticket.updatedAt
  };
}

export function getDemoDeskIssuesOverview(
  currentUserId: string,
  teamMembers: DeskOverviewAssignee[]
): DeskIssuesOverview {
  const tickets = getDemoHandoffTickets(currentUserId, teamMembers);
  const active = tickets.filter(
    (item) =>
      item.routedTo !== 'ai' &&
      (item.status === 'OPEN' || item.status === 'IN_PROGRESS')
  );

  return {
    counts: {
      open: tickets.filter((item) => item.status === 'OPEN').length,
      inProgress: tickets.filter((item) => item.status === 'IN_PROGRESS')
        .length,
      resolved: tickets.filter((item) => item.status === 'RESOLVED').length,
      closed: tickets.filter((item) => item.status === 'CLOSED').length,
      total: tickets.length
    },
    activeTickets: active.slice(0, 5).map(toOverviewItem),
    teamMembers,
    currentUserId
  };
}
