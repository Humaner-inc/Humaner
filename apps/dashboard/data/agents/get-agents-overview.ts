import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';
import type {
  CharacterType,
  EmojiMode,
  Formality,
  IndustryType,
  OpenerStyle,
  Verbosity
} from '@prisma/client';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  OrganizationCacheKey
} from '@/data/caching';
import {
  computeAgentMetrics,
  summarizeSourceStatuses,
  type AgentMetrics
} from '@/lib/agents/compute-agent-metrics';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { countConversationOutcomes } from '@/lib/conversations/conversation-outcome';
import { prisma } from '@/lib/db/prisma';
import { DEMO_AGENT_METRICS } from '@/lib/demo/demo-analytics';
import { isLocalDemo } from '@/lib/demo/is-local-demo';

export type AgentOverviewItem = {
  id: string;
  publicId: string;
  name: string;
  role: string;
  character: CharacterType;
  customCharacterPrompt: string | null;
  industry: IndustryType;
  verbosity: Verbosity;
  formality: Formality;
  emojiMode: EmojiMode;
  openerStyle: OpenerStyle;
  allowTypos: boolean;
  fallbackMessage: string;
  greetingMessage: string | null;
  image: string | null;
  showRole: boolean;
  isPaused: boolean;
  metrics: AgentMetrics;
};

export async function getAgentsOverview(): Promise<AgentOverviewItem[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const overview = await cache(
    async () => {
      const agents = await prisma.agent.findMany({
        where: { organizationId: session.user.organizationId },
        select: {
          id: true,
          publicId: true,
          name: true,
          role: true,
          character: true,
          customCharacterPrompt: true,
          industry: true,
          verbosity: true,
          formality: true,
          emojiMode: true,
          openerStyle: true,
          allowTypos: true,
          fallbackMessage: true,
          greetingMessage: true,
          image: true,
          showRole: true,
          isPaused: true,
          _count: { select: { chunks: true } },
          knowledgeSources: { select: { status: true } },
          conversations: {
            // Bound per agent so overview stays O(agents × window), not lifetime history.
            take: 500,
            orderBy: { updatedAt: 'desc' },
            select: {
              messages: {
                where: { role: 'ASSISTANT' },
                select: { role: true, unanswered: true, failureReason: true }
              },
              handoffTickets: {
                select: { status: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return agents.map((agent) => {
        const outcomeCounts = countConversationOutcomes(agent.conversations);

        const assistantMessages = agent.conversations.flatMap(
          (conversation) => conversation.messages
        );
        const totalAssistantMessages = assistantMessages.length;
        const unansweredMessages = assistantMessages.filter(
          (message) => message.unanswered
        ).length;

        const sourceCounts = summarizeSourceStatuses(
          agent.knowledgeSources.map((source) => source.status)
        );

        const metrics = computeAgentMetrics({
          outcomeCounts,
          unansweredMessages,
          totalAssistantMessages,
          chunkCount: agent._count.chunks,
          ...sourceCounts
        });

        return {
          id: agent.id,
          publicId: agent.publicId,
          name: agent.name,
          role: agent.role,
          character: agent.character,
          customCharacterPrompt: agent.customCharacterPrompt,
          industry: agent.industry,
          verbosity: agent.verbosity,
          formality: agent.formality,
          emojiMode: agent.emojiMode,
          openerStyle: agent.openerStyle,
          allowTypos: agent.allowTypos,
          fallbackMessage: agent.fallbackMessage,
          greetingMessage: agent.greetingMessage,
          image: agent.image,
          showRole: agent.showRole,
          isPaused: agent.isPaused,
          metrics
        };
      });
    },
    Caching.createOrganizationKeyParts(
      OrganizationCacheKey.Agents,
      session.user.organizationId,
      'overview'
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganizationTag(
          OrganizationCacheKey.Agents,
          session.user.organizationId
        )
      ]
    }
  )();

  if (isLocalDemo()) {
    return overview.map((agent) => ({
      ...agent,
      metrics: DEMO_AGENT_METRICS
    }));
  }

  return overview;
}
