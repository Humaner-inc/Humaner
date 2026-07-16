import type { Metadata } from 'next';

import {
  agentAnalyticsRoute,
  agentEscalationRoute,
  agentHistoryRoute,
  agentKnowledgeRoute,
  agentPersonaRoute,
  agentRunbooksRoute,
  integrationChannelRoute
} from '@/constants/routes';

import { createPageMetadata } from './create-page-metadata';
import {
  resolveDashboardPageTitle,
  resolvePublicPathname
} from './resolve-dashboard-page-title';

export function createDashboardPageMetadata(
  pathname: string,
  title?: string
): Metadata {
  const publicPath = resolvePublicPathname(pathname);
  return createPageMetadata(
    publicPath,
    title ?? resolveDashboardPageTitle(pathname)
  );
}

export function createAgentTabMetadata(
  agentId: string,
  tab:
    | 'persona'
    | 'knowledge'
    | 'runbooks'
    | 'escalation'
    | 'analytics'
    | 'history',
  title: string
): Metadata {
  const pathByTab = {
    persona: agentPersonaRoute(agentId),
    knowledge: agentKnowledgeRoute(agentId),
    runbooks: agentRunbooksRoute(agentId),
    escalation: agentEscalationRoute(agentId),
    analytics: agentAnalyticsRoute(agentId),
    history: agentHistoryRoute(agentId)
  } as const;

  return createPageMetadata(pathByTab[tab], title);
}

export function createIntegrationChannelMetadata(
  channelId: string,
  title: string
): Metadata {
  return createPageMetadata(integrationChannelRoute(channelId), title);
}
