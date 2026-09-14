import 'server-only';

import { Routes } from '@/constants/routes';
import { readCompanionWorkspaceRights } from '@/data/inbox/companion-rights';
import { CONNECT_APPS } from '@/lib/connect-apps';

import type { DashboardAgentTool } from '../types';

/**
 * Reports the workspace's third-party connectors (Linear, GitHub, Stripe,
 * Notion) so Companion can tell the user what is connected and route work
 * (e.g. assign a thread with a stripe / github / linear topic) or point them to
 * Settings to connect. Read-only — connecting stays a human, owner-only action.
 */
export const listConnectorsTool: DashboardAgentTool = {
  id: 'list_connectors',
  name: 'list_connectors',
  kind: 'read',
  description:
    'List workspace connectors (Linear, GitHub, Stripe, Notion): whether each is connected, its status, and where to connect it. Use to answer "is Stripe connected?" or before routing a thread to a connector topic.',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  requiredPages: ['inbox'],
  execute: async (_input, context) => {
    const { integrations } = await readCompanionWorkspaceRights(
      context.organizationId
    );
    const connected = new Set<string>(integrations);

    return JSON.stringify({
      connectors: CONNECT_APPS.map((app) => ({
        id: app.id,
        name: app.name,
        description: app.description,
        category: app.category,
        connected: connected.has(app.id),
        status: app.status === 'coming_soon' ? 'coming_soon' : 'available'
      })),
      connectPath: Routes.InboxSettings
    });
  }
};
