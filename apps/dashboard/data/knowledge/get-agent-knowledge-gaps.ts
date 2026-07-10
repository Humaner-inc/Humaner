import 'server-only';

import { redirect } from 'next/navigation';

import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export type AgentKnowledgeGapItem = {
  id: string;
  question: string;
  suggestedAnswer: string | null;
  createdAt: string;
};

export async function getAgentKnowledgeGaps(
  agentId: string
): Promise<AgentKnowledgeGapItem[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const gaps = await prisma.knowledgeGap.findMany({
    where: {
      agentId,
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

  return gaps.map((gap) => ({
    id: gap.id,
    question: gap.question,
    suggestedAnswer: gap.suggestedAnswer,
    createdAt: gap.createdAt.toISOString()
  }));
}
