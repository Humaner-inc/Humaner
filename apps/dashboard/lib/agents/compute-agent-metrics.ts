import type { SyncStatus } from '@prisma/client';

import type { ConversationOutcomeCounts } from '@/lib/conversations/conversation-outcome';
import { formatSatisfactionDetail } from '@/lib/conversations/conversation-outcome';

export type AgentMetricsInput = {
  outcomeCounts: ConversationOutcomeCounts;
  unansweredMessages: number;
  totalAssistantMessages: number;
  readySources: number;
  pendingSources: number;
  failedSources: number;
  chunkCount: number;
};
export type AgentMetric = {
  score: number;
  label: string;
  detail: string;
};

export type AgentMetrics = {
  satisfaction: AgentMetric;
  expertise: AgentMetric;
  gaps: string[];
};

function scoreLabel(score: number): string {
  if (score >= 76) {
    return 'Strong';
  }
  if (score >= 51) {
    return 'Solid';
  }
  if (score >= 26) {
    return 'Developing';
  }
  return 'Limited';
}

export function computeAgentMetrics(input: AgentMetricsInput): AgentMetrics {
  const gaps: string[] = [];
  const { outcomeCounts } = input;

  const satisfactionScore =
    outcomeCounts.total > 0
      ? Math.round((outcomeCounts.satisfied / outcomeCounts.total) * 100)
      : input.totalAssistantMessages > 0
        ? Math.round(
            ((input.totalAssistantMessages - input.unansweredMessages) /
              input.totalAssistantMessages) *
              100
          )
        : 0;

  const satisfactionDetail =
    outcomeCounts.total > 0
      ? formatSatisfactionDetail(outcomeCounts)
      : input.totalAssistantMessages > 0
        ? `${input.totalAssistantMessages - input.unansweredMessages} of ${input.totalAssistantMessages} questions answered`
        : 'No conversations yet';

  if (outcomeCounts.total === 0 && input.totalAssistantMessages === 0) {
    gaps.push('No chat history yet');
  } else if (input.unansweredMessages > 0) {
    gaps.push(
      `${input.unansweredMessages} unanswered question${input.unansweredMessages === 1 ? '' : 's'} — add knowledge to close gaps.`
    );
  } else if (outcomeCounts.unsolved > 0) {
    gaps.push(
      `${outcomeCounts.unsolved} conversation${outcomeCounts.unsolved === 1 ? '' : 's'} left visitors without proper answers.`
    );
  } else if (outcomeCounts.partial > 0) {
    gaps.push(
      `${outcomeCounts.partial} conversation${outcomeCounts.partial === 1 ? '' : 's'} had off-point answers — review knowledge coverage.`
    );
  } else if (outcomeCounts.escalated > 0) {
    gaps.push(
      `${outcomeCounts.escalated} conversation${outcomeCounts.escalated === 1 ? '' : 's'} escalated to Human Desk.`
    );
  } else if (outcomeCounts.open > 0) {
    gaps.push(
      `${outcomeCounts.open} conversation${outcomeCounts.open === 1 ? '' : 's'} still need attention.`
    );
  }
  let knowledgeScore = 0;
  if (input.readySources === 0) {
    gaps.push(
      'No trained knowledge — add URLs or docs so this agent can answer.'
    );
  } else {
    knowledgeScore = 25 + Math.min(input.readySources, 3) * 5;
    knowledgeScore += Math.min(input.chunkCount, 20) * 1.5;
  }

  if (input.pendingSources > 0) {
    gaps.push(
      `${input.pendingSources} source${input.pendingSources === 1 ? '' : 's'} still ingesting.`
    );
    knowledgeScore = Math.max(knowledgeScore - 10, 0);
  }

  if (input.failedSources > 0) {
    gaps.push(
      `${input.failedSources} source${input.failedSources === 1 ? '' : 's'} failed to sync — retry or replace them.`
    );
    knowledgeScore = Math.max(knowledgeScore - 15, 0);
  }

  if (input.readySources > 0 && input.chunkCount < 3) {
    gaps.push('Thin doc coverage — add more pages for broader expertise.');
  }

  let answerScore = 0;
  if (input.totalAssistantMessages > 0) {
    const answerRate =
      (input.totalAssistantMessages - input.unansweredMessages) /
      input.totalAssistantMessages;
    answerScore = Math.round(answerRate * 35);
  }

  const expertiseScore = Math.min(
    100,
    Math.round(knowledgeScore + answerScore)
  );

  const expertiseDetail =
    input.readySources > 0
      ? `${input.readySources} trained source${input.readySources === 1 ? '' : 's'} · ${input.chunkCount} chunk${input.chunkCount === 1 ? '' : 's'}`
      : 'Not trained on your content yet';

  return {
    satisfaction: {
      score: satisfactionScore,
      label: scoreLabel(satisfactionScore),
      detail: satisfactionDetail
    },
    expertise: {
      score: expertiseScore,
      label: scoreLabel(expertiseScore),
      detail: expertiseDetail
    },
    gaps: gaps.slice(0, 3)
  };
}

export function summarizeSourceStatuses(
  statuses: SyncStatus[]
): Pick<
  AgentMetricsInput,
  'readySources' | 'pendingSources' | 'failedSources'
> {
  return {
    readySources: statuses.filter((status) => status === 'READY').length,
    pendingSources: statuses.filter((status) =>
      ['PENDING', 'QUEUED', 'EXTRACTING', 'PROCESSING', 'INDEXING'].includes(
        status
      )
    ).length,
    failedSources: statuses.filter((status) => status === 'FAILED').length
  };
}
