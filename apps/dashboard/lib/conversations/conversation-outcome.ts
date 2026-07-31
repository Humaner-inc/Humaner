import type { MessageRole } from '@prisma/client';

import { UNGROUNDED_ANSWER_REASON } from '@/lib/chat/resolve-assistant-answer-state';

export type ConversationOutcome =
  | 'satisfied'
  | 'partial'
  | 'unsolved'
  | 'escalated'
  | 'open';

type ConversationMessage = {
  role: MessageRole;
  unanswered: boolean;
  failureReason?: string | null;
};

type HandoffTicketRef = {
  status: string;
};

const ACTIVE_HANDOFF_STATUSES = new Set(['OPEN', 'IN_PROGRESS']);

export const CONVERSATION_OUTCOME_LABELS: Record<ConversationOutcome, string> =
  {
    satisfied: 'Resolved',
    partial: 'Off-point',
    unsolved: 'Unresolved',
    escalated: 'Escalated',
    open: 'Open'
  };

export type ConversationOutcomeCounts = {
  total: number;
  satisfied: number;
  partial: number;
  unsolved: number;
  escalated: number;
  open: number;
};

export type MessageAnswerQuality = 'good' | 'gap' | 'partial';

export function deriveMessageAnswerQuality(message: {
  role: MessageRole;
  unanswered: boolean;
  failureReason?: string | null;
}): MessageAnswerQuality | null {
  if (message.role !== 'ASSISTANT') {
    return null;
  }

  if (message.unanswered) {
    return 'gap';
  }

  if (message.failureReason === UNGROUNDED_ANSWER_REASON) {
    return 'partial';
  }

  return 'good';
}

function hasKnowledgeGaps(messages: ConversationMessage[]): boolean {
  return messages.some(
    (message) => message.role === 'ASSISTANT' && message.unanswered
  );
}

function hasPartialAnswers(messages: ConversationMessage[]): boolean {
  return messages.some(
    (message) =>
      message.role === 'ASSISTANT' &&
      !message.unanswered &&
      message.failureReason === UNGROUNDED_ANSWER_REASON
  );
}

/**
 * Classify a conversation by what actually happened for the visitor.
 * - satisfied: agent answered without gaps or escalation
 * - partial: agent replied but without grounded knowledge
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

  if (hasKnowledgeGaps(input.messages)) {
    return 'unsolved';
  }

  if (hasPartialAnswers(input.messages)) {
    return 'partial';
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
    partial: 0,
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
  if (counts.partial > 0) {
    issues.push(`${counts.partial} off-point`);
  }
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
