import 'server-only';

import { redirect } from 'next/navigation';

import { queryKnowledgeGapCoversForAgent } from '@/data/knowledge/query-knowledge-gap-covers';
import { isDemoAgentRole } from '@/lib/admin-demos/demo-agent-role';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { getOrganizationCapabilities } from '@/lib/billing/capabilities';
import { prisma } from '@/lib/db/prisma';
import { getDemoPendingKnowledgeGaps } from '@/lib/demo/demo-answers';
import { isLocalDemo } from '@/lib/demo/is-local-demo';
import { filterCoveredContentGaps } from '@/lib/knowledge/filter-covered-content-gaps';

export type AgentKnowledgeGapItem = {
  id: string;
  question: string;
  suggestedAnswer: string | null;
  createdAt: string;
};

function toKnowledgeGapItem(gap: AgentKnowledgeGapItem): AgentKnowledgeGapItem {
  return {
    id: gap.id,
    question: gap.question,
    suggestedAnswer: gap.suggestedAnswer,
    createdAt: gap.createdAt
  };
}

export async function getAgentKnowledgeGaps(
  agentId: string
): Promise<AgentKnowledgeGapItem[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  if (!isLocalDemo()) {
    const capabilities = await getOrganizationCapabilities(
      session.user.organizationId
    );
    if (!capabilities.contentGaps) {
      return [];
    }
  }

  const covers = await queryKnowledgeGapCoversForAgent(
    agentId,
    session.user.organizationId
  );

  if (isLocalDemo()) {
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        organizationId: session.user.organizationId
      },
      select: { role: true }
    });
    if (agent && isDemoAgentRole(agent.role)) {
      return [];
    }
    return filterCoveredContentGaps(
      getDemoPendingKnowledgeGaps().map((gap) => ({
        ...gap,
        agentId,
        lastAskedAt: gap.createdAt
      })),
      covers
    ).map(toKnowledgeGapItem);
  }

  const gaps = await prisma.knowledgeGap.findMany({
    where: {
      agentId,
      agent: { organizationId: session.user.organizationId },
      status: 'PENDING'
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      question: true,
      suggestedAnswer: true,
      createdAt: true
    }
  });

  return filterCoveredContentGaps(
    gaps.map((gap) => ({
      id: gap.id,
      question: gap.question,
      suggestedAnswer: gap.suggestedAnswer,
      createdAt: gap.createdAt.toISOString(),
      agentId,
      lastAskedAt: gap.createdAt.toISOString()
    })),
    covers
  ).map(toKnowledgeGapItem);
}
