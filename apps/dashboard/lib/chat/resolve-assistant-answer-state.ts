//Determines whether an assistant reply should count as a content gap.

const GAP_DEFERRAL_PATTERNS: RegExp[] = [
  /\bi don'?t have the specific details\b/i,
  /\bdon'?t have\b[^.]{0,80}\bin front of me\b/i,
  /\bnot in (the )?knowledge base\b/i,
  /\bbased on what i have in (the )?knowledge base\b/i,
  /\bdon'?t have that in (the |my )?knowledge base\b/i,
  /\bwould you like me to open a ticket\b/i,
  /\bwould you prefer (that )?i open\b/i,
  /\bopen a ticket so\b/i,
  /\bsend an email to (the )?(support|team)\b/i,
  /\bconfirm (the )?exact details with the team\b/i,
  /\bI can open a ticket\b/i
];

export type ResolveAssistantAnswerStateInput = {
  /** Whether RAG / live data grounded the turn at prompt-build time. */
  retrievalGrounded: boolean;
  content: string;
  fallbackMessage: string;
};

export const UNGROUNDED_ANSWER_REASON = 'UNGROUNDED_ANSWER';

export type AssistantAnswerState = {
  unanswered: boolean;
  failureReason: string | null;
};

function normalizeForComparison(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function matchesFallback(content: string, fallbackMessage: string): boolean {
  const normalizedContent = normalizeForComparison(content);
  const normalizedFallback = normalizeForComparison(fallbackMessage);
  if (!normalizedFallback) {
    return false;
  }
  return (
    normalizedContent === normalizedFallback ||
    normalizedContent.includes(normalizedFallback)
  );
}

function looksLikeKnowledgeGapDeferral(content: string): boolean {
  return GAP_DEFERRAL_PATTERNS.some((pattern) => pattern.test(content));
}

function isSubstantiveAnswer(content: string): boolean {
  const trimmed = content.trim();
  if (trimmed.length < 48) {
    return false;
  }
  return !looksLikeKnowledgeGapDeferral(trimmed);
}

export function resolveAssistantAnswerState(
  input: ResolveAssistantAnswerStateInput
): AssistantAnswerState {
  const content = input.content.trim();
  if (!content) {
    return { unanswered: true, failureReason: 'EMPTY_RESPONSE' };
  }

  if (matchesFallback(content, input.fallbackMessage)) {
    return {
      unanswered: true,
      failureReason: input.retrievalGrounded ? 'FALLBACK_USED' : 'NO_CHUNKS'
    };
  }

  if (looksLikeKnowledgeGapDeferral(content)) {
    return {
      unanswered: true,
      failureReason: input.retrievalGrounded
        ? 'UNRESOLVED_DEFERRAL'
        : 'NO_CHUNKS'
    };
  }

  if (!input.retrievalGrounded && isSubstantiveAnswer(content)) {
    return {
      unanswered: false,
      failureReason: UNGROUNDED_ANSWER_REASON
    };
  }

  if (input.retrievalGrounded) {
    return { unanswered: false, failureReason: null };
  }

  return { unanswered: true, failureReason: 'NO_CHUNKS' };
}
