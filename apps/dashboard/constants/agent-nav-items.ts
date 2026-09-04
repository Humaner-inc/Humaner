import type { LucideIcon } from '@humaner/shared/icons';
import {
  BarChart3Icon,
  BookOpenIcon,
  ClockIcon,
  FileTextIcon,
  ShieldIcon,
  SlidersHorizontal,
  UserIcon
} from '@humaner/shared/icons';
import type {
  PlanCapabilities,
  PlanCapabilityContext
} from '@humaner/shared/plans';
import { getPlanCapabilities } from '@humaner/shared/plans';

import {
  agentAnalyticsRoute,
  agentConfigurationRoute,
  agentEscalationRoute,
  agentHistoryRoute,
  agentKnowledgeRoute,
  agentPersonaRoute,
  agentRunbooksRoute,
  Routes
} from '@/constants/routes';
import { isOssDeployment } from '@/lib/deployment-mode';
import { toPublicPathname } from '@/lib/routes/public-pathname';

export type AgentNavTabId =
  | 'configuration'
  | 'persona'
  | 'knowledge'
  | 'runbooks'
  | 'escalation'
  | 'analytics'
  | 'history';

export type AgentNavTab = {
  id: AgentNavTabId;
  label: string;
  icon: LucideIcon;
  href: (agentId: string) => string;
  requiredCapability?: keyof PlanCapabilities;
};

const CONFIGURATION_TAB: AgentNavTab = {
  id: 'configuration',
  label: 'Configuration',
  icon: SlidersHorizontal,
  href: (agentId) => agentConfigurationRoute(agentId)
};

const PERSONA_TAB: AgentNavTab = {
  id: 'persona',
  label: 'Persona',
  icon: UserIcon,
  href: (agentId) => agentPersonaRoute(agentId)
};

const KNOWLEDGE_TAB: AgentNavTab = {
  id: 'knowledge',
  label: 'Knowledge',
  icon: BookOpenIcon,
  href: (agentId) => agentKnowledgeRoute(agentId)
};

const RUNBOOKS_TAB: AgentNavTab = {
  id: 'runbooks',
  label: 'Runbooks',
  icon: FileTextIcon,
  href: (agentId) => agentRunbooksRoute(agentId),
  requiredCapability: 'runbooks'
};

const ESCALATION_TAB: AgentNavTab = {
  id: 'escalation',
  label: 'Escalation',
  icon: ShieldIcon,
  href: (agentId) => agentEscalationRoute(agentId)
};

const ANALYTICS_TAB: AgentNavTab = {
  id: 'analytics',
  label: 'Analytics',
  icon: BarChart3Icon,
  href: (agentId) => agentAnalyticsRoute(agentId)
};

const HISTORY_TAB: AgentNavTab = {
  id: 'history',
  label: 'History',
  icon: ClockIcon,
  href: (agentId) => agentHistoryRoute(agentId)
};

/** Humaner runs the agent, so the workspace is about shaping how it behaves. */
const CLOUD_AGENT_NAV_TABS: AgentNavTab[] = [
  PERSONA_TAB,
  KNOWLEDGE_TAB,
  RUNBOOKS_TAB,
  ESCALATION_TAB,
  ANALYTICS_TAB,
  HISTORY_TAB
];

/**
 * Custom runs the customer's own agent, so there is no hosted persona to edit
 * and no hosted transcripts to browse. Configuration carries identity,
 * endpoints, and guardrails; Analytics carries the Intelligence request log.
 */
const CUSTOM_AGENT_NAV_TABS: AgentNavTab[] = [
  CONFIGURATION_TAB,
  KNOWLEDGE_TAB,
  RUNBOOKS_TAB,
  ESCALATION_TAB,
  ANALYTICS_TAB
];

/**
 * Self-Host ships without hosted Persona (Intelligence) or the runbooks
 * engine. Configuration carries identity, endpoints, and guardrails.
 */
const OSS_AGENT_NAV_TABS: AgentNavTab[] = [
  CONFIGURATION_TAB,
  ESCALATION_TAB,
  ANALYTICS_TAB,
  HISTORY_TAB
];

/** @deprecated Prefer getAgentNavTabs() */
export const AGENT_NAV_TABS: AgentNavTab[] = CLOUD_AGENT_NAV_TABS;

const ALL_AGENT_TAB_IDS = new Set<AgentNavTabId>([
  ...CLOUD_AGENT_NAV_TABS.map((tab) => tab.id),
  ...CUSTOM_AGENT_NAV_TABS.map((tab) => tab.id)
]);

export function isCustomAgentWorkspace(orgTier?: string): boolean {
  if (isOssDeployment() || !orgTier) return false;
  return !getPlanCapabilities(orgTier).hostedAgent;
}

export function getAgentNavTabs(orgTier?: string): AgentNavTab[] {
  if (isOssDeployment()) {
    return OSS_AGENT_NAV_TABS;
  }
  return isCustomAgentWorkspace(orgTier)
    ? CUSTOM_AGENT_NAV_TABS
    : CLOUD_AGENT_NAV_TABS;
}

/** Where the sidebar agent row points, and where bare /agents/[id] lands. */
export function getDefaultAgentTabRoute(
  agentId: string,
  orgTier?: string
): string {
  if (isOssDeployment() || isCustomAgentWorkspace(orgTier)) {
    return agentConfigurationRoute(agentId);
  }
  return agentPersonaRoute(agentId);
}

export function getActiveAgentTab(pathname: string): AgentNavTabId | null {
  const publicPath = toPublicPathname(pathname);

  if (
    publicPath === Routes.AgentNew ||
    publicPath.startsWith(`${Routes.AgentNew}/`)
  ) {
    return null;
  }

  const match = publicPath.match(/^\/agents\/[^/]+(?:\/([^/]+))?/);
  if (!match) {
    return null;
  }

  const segment = match[1];
  if (!segment || segment === 'personality') {
    return 'persona';
  }

  if (ALL_AGENT_TAB_IDS.has(segment as AgentNavTabId)) {
    return segment as AgentNavTabId;
  }

  return null;
}

export function isAgentWorkspacePath(pathname: string): boolean {
  const publicPath = toPublicPathname(pathname);
  return /^\/agents\/(?!new(?:\/|$))[^/]+/.test(publicPath);
}

export function isAgentTabLocked(
  tab: AgentNavTab,
  orgTier: string,
  context?: PlanCapabilityContext
): boolean {
  if (isOssDeployment()) return false;
  if (!tab.requiredCapability) return false;
  const capabilities = getPlanCapabilities(orgTier, context);
  return !capabilities[tab.requiredCapability];
}
