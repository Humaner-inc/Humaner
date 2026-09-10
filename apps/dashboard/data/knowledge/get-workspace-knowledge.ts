import 'server-only';

import { redirect } from 'next/navigation';
import type { CharacterType } from '@prisma/client';

import { getAgentDetectedContentGaps } from '@/data/knowledge/get-agent-detected-content-gaps';
import {
  getAgentKnowledgeSettings,
  type AgentKnowledgeSettings
} from '@/data/knowledge/get-agent-knowledge-settings';
import {
  queryKnowledgeSourcesForAgent,
  type KnowledgeSourceItem
} from '@/data/knowledge/knowledge-source-query';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { requireDashboardPageOrRedirect } from '@/lib/auth/require-workspace-access';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { isOssDeployment } from '@/lib/deployment-mode';

export async function getWorkspaceKnowledgeAgent(
  organizationId: string
): Promise<{
  id: string;
  name: string;
  character: CharacterType;
} | null> {
  return prisma.agent.findFirst({
    where: { organizationId },
    select: { id: true, name: true, character: true },
    orderBy: { createdAt: 'asc' }
  });
}

export async function getWorkspaceKnowledgeData(): Promise<{
  agent: { id: string; name: string } | null;
  sources: KnowledgeSourceItem[];
  detectedGaps: Awaited<ReturnType<typeof getAgentDetectedContentGaps>>;
  pendingGaps: Array<{
    id: string;
    question: string;
    suggestedAnswer: string | null;
    createdAt: string;
  }>;
  knowledgeSettings: AgentKnowledgeSettings | null;
}> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  await requireDashboardPageOrRedirect('inbox');

  const agent = await getWorkspaceKnowledgeAgent(session.user.organizationId);
  if (!agent) {
    return {
      agent: null,
      sources: [],
      detectedGaps: [],
      pendingGaps: [],
      knowledgeSettings: null
    };
  }

  const oss = isOssDeployment();
  const [sources, detectedGaps, knowledgeSettings] = await Promise.all([
    queryKnowledgeSourcesForAgent(agent.id, session.user.organizationId),
    oss
      ? Promise.resolve([])
      : getAgentDetectedContentGaps(agent.id).catch(() => []),
    oss ? Promise.resolve(null) : getAgentKnowledgeSettings(agent.id)
  ]);

  return {
    agent,
    sources,
    detectedGaps,
    pendingGaps: [],
    knowledgeSettings
  };
}
