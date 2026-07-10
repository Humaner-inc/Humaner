import type { MessageRole } from '@prisma/client';

export type ConversationOutcome =
  | 'satisfied'
  | 'unsolved'
  | 'escalated'
  | 'open';

type ConversationMessage = {
  role: MessageRole;
  unanswered: boolean;
};

type HandoffTicketRef = {
  status: string;
};

const ACTIVE_HANDOFF_STATUSES = new Set(['OPEN', 'IN_PROGRESS']);

export const CONVERSATION_OUTCOME_LABELS: Record<ConversationOutcome, string> =
  {
    satisfied: 'Resolved',
    unsolved: 'Unresolved',
    escalated: 'Escalated',
    open: 'Open'
  };

export type ConversationOutcomeCounts = {
  total: number;
  satisfied: number;
  unsolved: number;
  escalated: number;
  open: number;
};

/**
 * Classify a conversation by what actually happened for the visitor.
 * - satisfied: agent answered without gaps or escalation
 * - unsolved: visitor left without grounded answers
 * - escalated: visitor needed Human Desk
 * - open: Human Desk ticket still active
 */
export function deriveConversationOutcome(input: {
  messages: ConversationMessage[];
  handoffTickets?: HandoffTicketRef[];
}): ConversationOutcome {
  if (input.messages.length === 0) {
    return 'open';
  }

  const handoffs = input.handoffTickets ?? [];
  const hasActiveHandoff = handoffs.some((ticket) =>
    ACTIVE_HANDOFF_STATUSES.has(ticket.status)
  );
  if (hasActiveHandoff) {
    return 'open';
  }

  const hasKnowledgeGaps = input.messages.some(
    (message) => message.role === 'ASSISTANT' && message.unanswered
  );
  if (hasKnowledgeGaps) {
    return 'unsolved';
  }

  if (handoffs.length > 0) {
    return 'escalated';
  }

  return 'satisfied';
}

export function countConversationOutcomes(
  conversations: Array<{
    messages: ConversationMessage[];
    handoffTickets?: HandoffTicketRef[];
  }>
): ConversationOutcomeCounts {
  const counts: ConversationOutcomeCounts = {
    total: conversations.length,
    satisfied: 0,
    unsolved: 0,
    escalated: 0,
    open: 0
  };

  for (const conversation of conversations) {
    const outcome = deriveConversationOutcome(conversation);
    counts[outcome] += 1;
  }

  return counts;
}

export function formatSatisfactionDetail(
  counts: ConversationOutcomeCounts
): string {
  if (counts.total === 0) {
    return 'No conversations yet';
  }

  const parts = [`${counts.satisfied} of ${counts.total} issues solved`];

  const issues: string[] = [];
  if (counts.unsolved > 0) {
    issues.push(`${counts.unsolved} unresolved`);
  }
  if (counts.escalated > 0) {
    issues.push(`${counts.escalated} escalated`);
  }
  if (counts.open > 0) {
    issues.push(`${counts.open} open`);
  }

  if (issues.length > 0) {
    parts.push(issues.join(' · '));
  }

  return parts.join(' · ');
}
