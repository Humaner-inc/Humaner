import 'server-only';

import { createOrganizationAgent } from '@/lib/dashboard-agent-skills/mutations/agents';

import type { DashboardAgentTool } from '../types';

export const createAgentTool: DashboardAgentTool = {
  id: 'create_agent',
  name: 'create_agent',
  kind: 'write',
  description:
    'Create a new AI agent in the workspace with a name and optional greeting message.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Display name for the new agent.'
      },
      greetingMessage: {
        type: 'string',
        description:
          'Optional first message visitors see when the widget opens.'
      }
    },
    required: ['name']
  },
  requiredPages: ['agents'],
  execute: async (input, context) => {
    const name = typeof input.name === 'string' ? input.name : '';
    const greetingMessage =
      typeof input.greetingMessage === 'string'
        ? input.greetingMessage
        : undefined;

    const created = await createOrganizationAgent(context, {
      name,
      greetingMessage
    });

    return JSON.stringify({
      ok: true,
      agent: created,
      message: `Created agent "${created.name}".`
    });
  }
};
