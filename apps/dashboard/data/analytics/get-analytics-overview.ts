import 'server-only';

import { redirect } from 'next/navigation';
import { getPlanCapabilities, getPlanForTier } from '@humaner/shared/plans';
import type { MessageRole } from '@prisma/client';
import { format, startOfDay, subDays } from 'date-fns';

import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { getMessagesUsedThisMonth } from '@/lib/billing/message-usage';
import { normalizeTier } from '@/lib/billing/tier';
import {
  countConversationOutcomes,
  deriveConversationOutcome,
  formatSatisfactionDetail
} from '@/lib/conversations/conversation-outcome';
import { prisma } from '@/lib/db/prisma';
import {
  extractDetectedContentGaps,
  type DetectedContentGap
} from '@/lib/knowledge/extract-detected-gaps';

export type AnalyticsVolumePoint = {
  date: string;
  messages: number;
  conversations: number;
  /** 0–100 resolution rate for conversations started that day. */
  satisfactionRate: number;
};

export type AnalyticsKnowledgeGap = DetectedContentGap;

export type AnalyticsOverview = {
  summary: {
    totalConversations: number;
    satisfiedConversations: number;
    resolutionRate: number;
    satisfactionDetail: string;
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
  messages: { createdAt: Date }[],
  conversations: Array<{
    createdAt: Date;
    messages: Array<{ role: MessageRole; unanswered: boolean }>;
    handoffTickets: Array<{ status: string }>;
  }>
): AnalyticsVolumePoint[] {
  const messageCounts = new Map<string, number>();
  const conversationCounts = new Map<string, number>();
  const satisfiedCounts = new Map<string, number>();

  for (let index = 0; index < VOLUME_DAYS; index += 1) {
    const date = format(
      subDays(startOfDay(new Date()), VOLUME_DAYS - 1 - index),
      'yyyy-MM-dd'
    );
    messageCounts.set(date, 0);
    conversationCounts.set(date, 0);
    satisfiedCounts.set(date, 0);
  }

  for (const message of messages) {
    const date = format(message.createdAt, 'yyyy-MM-dd');
    if (messageCounts.has(date)) {
      messageCounts.set(date, (messageCounts.get(date) ?? 0) + 1);
    }
  }

  for (const conversation of conversations) {
    const date = format(conversation.createdAt, 'yyyy-MM-dd');
    if (!conversationCounts.has(date)) {
      continue;
    }
    conversationCounts.set(date, (conversationCounts.get(date) ?? 0) + 1);
    if (
      deriveConversationOutcome({
        messages: conversation.messages,
        handoffTickets: conversation.handoffTickets
      }) === 'satisfied'
    ) {
      satisfiedCounts.set(date, (satisfiedCounts.get(date) ?? 0) + 1);
    }
  }

  return Array.from(messageCounts.entries()).map(([date, messageCount]) => {
    const conversationCount = conversationCounts.get(date) ?? 0;
    const satisfiedCount = satisfiedCounts.get(date) ?? 0;
    return {
      date,
      messages: messageCount,
      conversations: conversationCount,
      satisfactionRate:
        conversationCount > 0
          ? Math.round((satisfiedCount / conversationCount) * 100)
          : 0
    };
  });
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

  const [
    organization,
    conversations,
    volumeMessages,
    volumeConversations,
    gapConversations
  ] = await Promise.all([
    prisma.organization.findFirst({
      where: { id: organizationId },
      select: { tier: true }
    }),
    prisma.conversation.findMany({
      where: { agent: { organizationId, ...agentFilter } },
      select: {
        messages: {
          select: { role: true, unanswered: true }
        },
        handoffTickets: {
          select: { status: true }
        }
      }
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
        createdAt: { gte: volumeStart },
        agent: { organizationId, ...agentFilter }
      },
      select: {
        createdAt: true,
        messages: {
          select: { role: true, unanswered: true }
        },
        handoffTickets: {
          select: { status: true }
        }
      }
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

  const outcomeCounts = countConversationOutcomes(conversations);
  const resolutionRate =
    outcomeCounts.total > 0
      ? Math.round((outcomeCounts.satisfied / outcomeCounts.total) * 100)
      : 0;

  const tier = normalizeTier(organization?.tier ?? 'free');
  const plan = getPlanForTier(tier);

  // Content-gap detection is a Frontier (v2.0) capability. Lower tiers still see the
  // unanswered count in analytics, but not the itemized gaps + suggested fixes.
  const contentGapsEnabled = getPlanCapabilities(tier).contentGaps;
  const detectedGaps = extractDetectedContentGaps(gapConversations);
  const knowledgeGaps = contentGapsEnabled ? detectedGaps : [];
  const unansweredCount = detectedGaps.reduce(
    (total, gap) => total + gap.count,
    0
  );
  const messagesUsed = await getMessagesUsedThisMonth(organizationId, tier);

  const totalMessages = await prisma.message.count({
    where: { conversation: { agent: { organizationId, ...agentFilter } } }
  });

  return {
    summary: {
      totalConversations: outcomeCounts.total,
      satisfiedConversations: outcomeCounts.satisfied,
      resolutionRate,
      satisfactionDetail: formatSatisfactionDetail(outcomeCounts),
      unansweredCount,
      totalMessages,
      messagesUsed,
      includedMessages: plan.includedMessages
    },
    volumeByDay: buildVolumeByDay(volumeMessages, volumeConversations),
    knowledgeGaps
  };
}
