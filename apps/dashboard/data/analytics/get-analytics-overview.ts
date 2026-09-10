import 'server-only';

import { redirect } from 'next/navigation';
import {
  getEffectivePlan,
  getPlanCapabilities,
  isOperatorOwnedQuotaPlan
} from '@humaner/shared/plans';
import type { MessageRole } from '@prisma/client';
import { format, startOfDay, subDays } from 'date-fns';

import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { creditUsageForAccount } from '@/lib/billing/credit-usage';
import { getMessagesUsedThisMonth } from '@/lib/billing/message-usage';
import { normalizeTier } from '@/lib/billing/tier';
import {
  countConversationOutcomes,
  deriveConversationOutcome,
  formatSatisfactionDetail
} from '@/lib/conversations/conversation-outcome';
import { prisma } from '@/lib/db/prisma';
import { getDemoAnalyticsOverview } from '@/lib/demo/demo-analytics';
import { isLocalDemo } from '@/lib/demo/is-local-demo';
import {
  extractDetectedContentGaps,
  type DetectedContentGap
} from '@/lib/knowledge/extract-detected-gaps';
import { filterCoveredContentGaps } from '@/lib/knowledge/filter-covered-content-gaps';

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
    creditsUsedCents: number;
    creditsRemainingCents: number;
    operatorOwnedQuota?: boolean;
  };
  volumeByDay: AnalyticsVolumePoint[];
  knowledgeGaps: AnalyticsKnowledgeGap[];
};

const VOLUME_DAYS = 30;
const GAP_CONVERSATION_LIMIT = 200;
/** Cap lifetime outcome scan so analytics stays bounded as tenants grow. */
const OUTCOME_CONVERSATION_LIMIT = 5000;

function buildVolumeByDay(
  messageCounts: Map<string, number>,
  conversations: Array<{
    createdAt: Date;
    messages: Array<{
      role: MessageRole;
      unanswered: boolean;
      failureReason?: string | null;
    }>;
    handoffTickets: Array<{ status: string }>;
  }>
): AnalyticsVolumePoint[] {
  const conversationCounts = new Map<string, number>();
  const satisfiedCounts = new Map<string, number>();

  for (let index = 0; index < VOLUME_DAYS; index += 1) {
    const date = format(
      subDays(startOfDay(new Date()), VOLUME_DAYS - 1 - index),
      'yyyy-MM-dd'
    );
    if (!messageCounts.has(date)) {
      messageCounts.set(date, 0);
    }
    conversationCounts.set(date, 0);
    satisfiedCounts.set(date, 0);
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

  if (isLocalDemo()) {
    return getDemoAnalyticsOverview();
  }

  const organizationId = session.user.organizationId;
  const agentFilter = options?.agentId ? { id: options.agentId } : {};
  const volumeStart = subDays(startOfDay(new Date()), VOLUME_DAYS - 1);

  const organization = await prisma.organization.findFirst({
    where: { id: organizationId },
    select: {
      tier: true,
      includedMessages: true,
      billingModel: true,
      creditBalanceCents: true,
      owner: {
        select: { billingModel: true, creditBalanceCents: true }
      }
    }
  });
  const tier = normalizeTier(organization?.tier ?? 'free');
  const plan = getEffectivePlan(tier, organization?.includedMessages);

  const [
    conversations,
    volumeMessageCounts,
    volumeConversations,
    gapConversations,
    messagesUsed,
    totalMessages,
    gapCovers
  ] = await Promise.all([
    prisma.conversation.findMany({
      where: { agent: { organizationId, ...agentFilter } },
      select: {
        messages: {
          where: { role: 'ASSISTANT' },
          select: { role: true, unanswered: true, failureReason: true }
        },
        handoffTickets: {
          select: { status: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: OUTCOME_CONVERSATION_LIMIT
    }),
    (async () => {
      type VolumeRow = { day: string; count: bigint };
      const agentId = options?.agentId;
      const rows = agentId
        ? await prisma.$queryRaw<VolumeRow[]>`
            SELECT to_char(
                     date_trunc('day', m."createdAt" AT TIME ZONE 'UTC'),
                     'YYYY-MM-DD'
                   ) AS day,
                   COUNT(*)::bigint AS count
            FROM "Message" m
            JOIN "Conversation" c ON c.id = m."conversationId"
            JOIN "Agent" a ON a.id = c."agentId"
            WHERE c."agentId" = ${agentId}::uuid
              AND a."organizationId" = ${organizationId}::uuid
              AND m."createdAt" >= ${volumeStart}
            GROUP BY 1 ORDER BY 1
          `
        : await prisma.$queryRaw<VolumeRow[]>`
            SELECT to_char(
                     date_trunc('day', m."createdAt" AT TIME ZONE 'UTC'),
                     'YYYY-MM-DD'
                   ) AS day,
                   COUNT(*)::bigint AS count
            FROM "Message" m
            JOIN "Conversation" c ON c.id = m."conversationId"
            JOIN "Agent" a ON a.id = c."agentId"
            WHERE a."organizationId" = ${organizationId}::uuid
              AND m."createdAt" >= ${volumeStart}
            GROUP BY 1 ORDER BY 1
          `;
      const map = new Map<string, number>();
      for (const row of rows) {
        if (!row.day) {
          continue;
        }
        map.set(String(row.day).slice(0, 10), Number(row.count));
      }
      return map;
    })(),
    prisma.conversation.findMany({
      where: {
        createdAt: { gte: volumeStart },
        agent: { organizationId, ...agentFilter }
      },
      select: {
        createdAt: true,
        messages: {
          where: { role: 'ASSISTANT' },
          select: { role: true, unanswered: true, failureReason: true }
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
    }),
    getMessagesUsedThisMonth(organizationId, tier),
    prisma.message.count({
      where: { conversation: { agent: { organizationId, ...agentFilter } } }
    }),
    Promise.resolve([])
  ]);

  const outcomeCounts = countConversationOutcomes(conversations);
  const resolutionRate =
    outcomeCounts.total > 0
      ? Math.round((outcomeCounts.satisfied / outcomeCounts.total) * 100)
      : 0;

  const contentGapsEnabled = getPlanCapabilities(tier).contentGaps;
  const detectedGaps = filterCoveredContentGaps(
    extractDetectedContentGaps(gapConversations),
    gapCovers
  );
  const knowledgeGaps = contentGapsEnabled ? detectedGaps : [];
  const unansweredCount = detectedGaps.reduce(
    (total, gap) => total + gap.count,
    0
  );
  const credits = creditUsageForAccount(organization ?? {}, {
    messagesUsed,
    includedMessages: plan.includedMessages
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
      includedMessages: plan.includedMessages,
      creditsUsedCents: credits.usedCents,
      creditsRemainingCents: credits.remainingCents,
      operatorOwnedQuota: isOperatorOwnedQuotaPlan(plan)
    },
    volumeByDay: buildVolumeByDay(volumeMessageCounts, volumeConversations),
    knowledgeGaps
  };
}
