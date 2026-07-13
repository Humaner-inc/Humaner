import 'server-only';

import { updateAgentGreeting } from '@/lib/dashboard-agent-skills/mutations/agents';

import type { DashboardAgentTool } from '../types';

export const updateAgentGreetingTool: DashboardAgentTool = {
  id: 'update_agent_greeting',
  name: 'update_agent_greeting',
  kind: 'write',
  description: 'Update the widget greeting message for an agent.',
  inputSchema: {
    type: 'object',
    properties: {
      agentId: {
        type: 'string',
        description: 'Internal agent id from list_agents.'
      },
      greetingMessage: {
        type: 'string',
        description: 'New greeting text. Pass an empty string to clear it.'
      }
    },
    required: ['agentId', 'greetingMessage']
  },
  requiredPages: ['agents'],
  execute: async (input, context) => {
    const agentId = typeof input.agentId === 'string' ? input.agentId : '';
    const greetingMessage =
      typeof input.greetingMessage === 'string' ? input.greetingMessage : '';

    if (!agentId) {
      return JSON.stringify({ error: 'agentId is required.' });
    }

    const result = await updateAgentGreeting(context, {
      agentId,
      greetingMessage
    });

    return JSON.stringify({
      ok: true,
      agent: result,
      message: `Updated greeting for "${result.name}".`
    });
  }
};
