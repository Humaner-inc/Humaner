import { format, startOfDay, subDays } from 'date-fns';

import type { AnalyticsOverview } from '@/data/analytics/get-analytics-overview';
import type { AgentMetrics } from '@/lib/agents/compute-agent-metrics';

function volumeCurve(dayIndex: number, totalDays: number): number {
  const wave = Math.sin((dayIndex / totalDays) * Math.PI * 2) * 8;
  const trend = 18 + dayIndex * 0.35;
  const weekendDrop = dayIndex % 7 === 0 || dayIndex % 7 === 6 ? 0.55 : 1;
  return Math.max(4, Math.round((trend + wave) * weekendDrop));
}

export function getDemoAnalyticsOverview(): AnalyticsOverview {
  const totalDays = 30;
  const volumeByDay = Array.from({ length: totalDays }, (_, index) => {
    const date = format(
      subDays(startOfDay(new Date()), totalDays - 1 - index),
      'yyyy-MM-dd'
    );
    const messages = volumeCurve(index, totalDays);
    const conversations = Math.max(1, Math.round(messages / 4.2));
    const satisfactionRate = 72 + Math.round((index / totalDays) * 16);
    return {
      date,
      messages,
      conversations,
      satisfactionRate: Math.min(94, satisfactionRate)
    };
  });

  const totalMessages = volumeByDay.reduce(
    (sum, point) => sum + point.messages,
    0
  );
  const totalConversations = volumeByDay.reduce(
    (sum, point) => sum + point.conversations,
    0
  );

  return {
    summary: {
      totalConversations,
      satisfiedConversations: Math.round(totalConversations * 0.86),
      resolutionRate: 86,
      satisfactionDetail: `${Math.round(totalConversations * 0.86)} of ${totalConversations} conversations helped`,
      unansweredCount: 9,
      totalMessages,
      messagesUsed: 820,
      includedMessages: 2000,
      operatorOwnedQuota: false
    },
    volumeByDay,
    knowledgeGaps: []
  };
}

export const DEMO_AGENT_METRICS: AgentMetrics = {
  satisfaction: {
    score: 86,
    label: 'Strong',
    detail: '86 of 100 conversations helped'
  },
  expertise: {
    score: 78,
    label: 'Strong',
    detail: '4 trained sources · 42 chunks'
  },
  gaps: [
    '3 unanswered questions, add some knowledge.',
    '2 conversations escalated to Human Desk.'
  ]
};
