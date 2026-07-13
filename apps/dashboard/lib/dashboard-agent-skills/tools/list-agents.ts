import 'server-only';

import { prisma } from '@/lib/db/prisma';

import type { DashboardAgentContext, DashboardAgentTool } from '../types';

type ListAgentsInput = Record<string, never>;

export const listAgentsTool: DashboardAgentTool = {
  id: 'list_agents',
  name: 'list_agents',
  kind: 'read',
  description:
    'List AI agents in the current organization with name, role, industry, and paused status.',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  requiredPages: ['agents'],
  execute: async (_input, context) => {
    const agents = await prisma.agent.findMany({
      where: { organizationId: context.organizationId },
      select: {
        id: true,
        name: true,
        role: true,
        industry: true,
        isPaused: true,
        publicId: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (agents.length === 0) {
      return JSON.stringify({
        agents: [],
        message: 'No agents yet. Suggest creating one at /dashboard/agents/new.'
      });
    }

    return JSON.stringify({
      agents: agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        industry: agent.industry,
        isPaused: agent.isPaused,
        personaPath: `/dashboard/agents/${agent.id}/persona`,
        knowledgePath: `/dashboard/agents/${agent.id}/knowledge`
      }))
    });
  }
};
