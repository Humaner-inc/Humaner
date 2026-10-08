import type { Metadata } from 'next';

import {
  agentAnalyticsRoute,
  agentConfigurationRoute,
  agentEscalationRoute,
  agentHistoryRoute,
  agentKnowledgeRoute,
  agentPersonaRoute,
  agentRunbooksRoute
} from '@/constants/routes';

import { createPageMetadata } from './create-page-metadata';
import {
  resolveDashboardPageTitle,
  resolvePublicPathname,
  stripSearchAndHash
} from './resolve-dashboard-page-title';

export function createDashboardPageMetadata(
  pathname: string,
  title?: string
): Metadata {
  const publicPath = stripSearchAndHash(resolvePublicPathname(pathname));
  return createPageMetadata(
    publicPath,
    title ?? resolveDashboardPageTitle(pathname)
  );
}

export function createAgentTabMetadata(
  agentId: string,
  tab:
    | 'configuration'
    | 'persona'
    | 'knowledge'
    | 'runbooks'
    | 'escalation'
    | 'analytics'
    | 'history',
  title: string
): Metadata {
  const pathByTab = {
    configuration: agentConfigurationRoute(agentId),
    persona: agentPersonaRoute(agentId),
    knowledge: agentKnowledgeRoute(agentId),
    runbooks: agentRunbooksRoute(agentId),
    escalation: agentEscalationRoute(agentId),
    analytics: agentAnalyticsRoute(agentId),
    history: agentHistoryRoute(agentId)
  } as const;

  return createPageMetadata(pathByTab[tab], title);
}
