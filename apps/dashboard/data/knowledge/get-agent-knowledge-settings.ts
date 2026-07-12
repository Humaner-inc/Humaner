import 'server-only';

import { notFound, redirect } from 'next/navigation';
import type { KnowledgeRescanInterval } from '@prisma/client';

import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export type AgentKnowledgeSettings = {
  knowledgeRescanInterval: KnowledgeRescanInterval;
};

export async function getAgentKnowledgeSettings(
  agentId: string
): Promise<AgentKnowledgeSettings> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const agent = await prisma.agent.findFirst({
    where: {
      id: agentId,
      organizationId: session.user.organizationId
    },
    select: {
      knowledgeRescanInterval: true
    }
  });

  if (!agent) {
    notFound();
  }

  return {
    knowledgeRescanInterval: agent.knowledgeRescanInterval
  };
}
