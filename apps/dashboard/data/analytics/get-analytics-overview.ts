import 'server-only';

import { getPlanForTier } from '@humaner/shared/plans';
import { format, startOfDay, subDays } from 'date-fns';
import { redirect } from 'next/navigation';

import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { getMessageUsage } from '@/lib/billing/polar-usage';
import { normalizeTier } from '@/lib/billing/tier';
import { prisma } from '@/lib/db/prisma';

export type AnalyticsVolumePoint = {
  date: string;
  messages: number;
};

export type AnalyticsKnowledgeGap = {
  question: string;
  count: number;
  agentId: string;
  agentName: string;
  lastAskedAt: string;
  conversationId: string;
};

export type AnalyticsOverview = {
  summary: {
    totalConversations: number;
    resolvedConversations: number;
    resolutionRate: number;
    unansweredCount: number;
    totalMessages: number;
    messagesUsed: number;
    includedMessages: number;
  };
  volumeByDay: AnalyticsVolumePoint[];
  knowledgeGaps: AnalyticsKnowledgeGap[];
};

const VOLUME_DAYS = 30;
const GAP_CONVERSATION_LIMIT = 200;

function buildVolumeByDay(
  messages: { createdAt: Date }[]
): AnalyticsVolumePoint[] {
  const counts = new Map<string, number>();

  for (let index = 0; index < VOLUME_DAYS; index += 1) {
    const date = format(
      subDays(startOfDay(new Date()), VOLUME_DAYS - 1 - index),
      'yyyy-MM-dd'
    );
    counts.set(date, 0);
  }

  for (const message of messages) {
    const date = format(message.createdAt, 'yyyy-MM-dd');
    if (counts.has(date)) {
      counts.set(date, (counts.get(date) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries()).map(([date, messageCount]) => ({
    date,
    messages: messageCount
  }));
}

function extractKnowledgeGaps(
  conversations: Array<{
    id: string;
    updatedAt: Date;
    agent: { id: string; name: string };
    messages: Array<{
      role: 'USER' | 'ASSISTANT';
      content: string;
      unanswered: boolean;
      createdAt: Date;
    }>;
  }>
): AnalyticsKnowledgeGap[] {
  const grouped = new Map<
    string,
    {
      question: string;
      count: number;
      agentId: string;
      agentName: string;
      lastAskedAt: Date;
      conversationId: string;
    }
  >();

  for (const conversation of conversations) {
    let lastUserQuestion: string | null = null;

    for (const message of conversation.messages) {
      if (message.role === 'USER') {
        lastUserQuestion = message.content.trim();
        continue;
      }

      if (message.role === 'ASSISTANT' && message.unanswered && lastUserQuestion) {
        const key = `${conversation.agent.id}:${lastUserQuestion.toLowerCase()}`;
        const existing = grouped.get(key);

        if (existing) {
          existing.count += 1;
          if (message.createdAt > existing.lastAskedAt) {
            existing.lastAskedAt = message.createdAt;
            existing.conversationId = conversation.id;
          }
        } else {
          grouped.set(key, {
            question: lastUserQuestion,
            count: 1,
            agentId: conversation.agent.id,
            agentName: conversation.agent.name,
            lastAskedAt: message.createdAt,
            conversationId: conversation.id
          });
        }
      }
    }
  }

  return Array.from(grouped.values())
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }
      return right.lastAskedAt.getTime() - left.lastAskedAt.getTime();
    })
    .map((gap) => ({
      question: gap.question,
      count: gap.count,
      agentId: gap.agentId,
      agentName: gap.agentName,
      lastAskedAt: gap.lastAskedAt.toISOString(),
      conversationId: gap.conversationId
    }));
}

export async function getAnalyticsOverview(options?: {
  agentId?: string;
}): Promise<AnalyticsOverview> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const organizationId = session.user.organizationId;
  const agentFilter = options?.agentId ? { id: options.agentId } : {};
  const volumeStart = subDays(startOfDay(new Date()), VOLUME_DAYS - 1);

  const [organization, conversations, volumeMessages, gapConversations] =
    await Promise.all([
      prisma.organization.findFirst({
        where: { id: organizationId },
        select: { tier: true, polarCustomerId: true }
      }),
      prisma.conversation.findMany({
        where: { agent: { organizationId, ...agentFilter } },
        select: { resolved: true }
      }),
      prisma.message.findMany({
        where: {
          createdAt: { gte: volumeStart },
          conversation: { agent: { organizationId, ...agentFilter } }
        },
        select: { createdAt: true }
      }),
      prisma.conversation.findMany({
        where: {
          agent: { organizationId, ...agentFilter },
          messages: { some: { role: 'ASSISTANT', unanswered: true } }
        },
        select: {
          id: true,
          updatedAt: true,
          agent: { select: { id: true, name: true } },
          messages: {
            orderBy: { createdAt: 'asc' },
            select: {
              role: true,
              content: true,
              unanswered: true,
              createdAt: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: GAP_CONVERSATION_LIMIT
      })
    ]);

  const totalConversations = conversations.length;
  const resolvedConversations = conversations.filter(
    (conversation) => conversation.resolved
  ).length;
  const resolutionRate =
    totalConversations > 0
      ? Math.round((resolvedConversations / totalConversations) * 100)
      : 0;

  const knowledgeGaps = extractKnowledgeGaps(gapConversations);
  const unansweredCount = knowledgeGaps.reduce(
    (total, gap) => total + gap.count,
    0
  );

  const tier = normalizeTier(organization?.tier ?? 'free');
  const plan = getPlanForTier(tier);
  let messagesUsed = 0;

  if (organization?.polarCustomerId) {
    const usage = await getMessageUsage(organization.polarCustomerId);
    messagesUsed = usage?.consumed ?? 0;
  }

  const totalMessages = await prisma.message.count({
    where: { conversation: { agent: { organizationId, ...agentFilter } } }
  });

  return {
    summary: {
      totalConversations,
      resolvedConversations,
      resolutionRate,
      unansweredCount,
      totalMessages,
      messagesUsed,
      includedMessages: plan.includedMessages
    },
    volumeByDay: buildVolumeByDay(volumeMessages),
    knowledgeGaps
  };
}
