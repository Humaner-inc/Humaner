import type { LucideIcon } from '@humaner/shared/icons';
import {
  BarChart3Icon,
  BookOpenIcon,
  ClockIcon,
  FileTextIcon,
  ShieldIcon,
  UserIcon
} from '@humaner/shared/icons';
import type { PlanCapabilities } from '@humaner/shared/plans';
import { getPlanCapabilities } from '@humaner/shared/plans';

import {
  agentAnalyticsRoute,
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

const CLOUD_AGENT_NAV_TABS: AgentNavTab[] = [
  {
    id: 'persona',
    label: 'Persona',
    icon: UserIcon,
    href: (agentId) => agentPersonaRoute(agentId)
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    icon: BookOpenIcon,
    href: (agentId) => agentKnowledgeRoute(agentId)
  },
  {
    id: 'runbooks',
    label: 'Runbooks',
    icon: FileTextIcon,
    href: (agentId) => agentRunbooksRoute(agentId),
    requiredCapability: 'agentDesk'
  },
  {
    id: 'escalation',
    label: 'Escalation',
    icon: ShieldIcon,
    href: (agentId) => agentEscalationRoute(agentId)
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3Icon,
    href: (agentId) => agentAnalyticsRoute(agentId)
  },
  {
    id: 'history',
    label: 'History',
    icon: ClockIcon,
    href: (agentId) => agentHistoryRoute(agentId)
  }
];

/** @deprecated Prefer getAgentNavTabs() */
export const AGENT_NAV_TABS: AgentNavTab[] = CLOUD_AGENT_NAV_TABS;

const OSS_HIDDEN_AGENT_TABS = new Set<AgentNavTabId>(['knowledge', 'runbooks']);

export function getAgentNavTabs(): AgentNavTab[] {
  if (isOssDeployment()) {
    return CLOUD_AGENT_NAV_TABS.filter(
      (tab) => !OSS_HIDDEN_AGENT_TABS.has(tab.id)
    );
  }
  return CLOUD_AGENT_NAV_TABS;
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

  if (CLOUD_AGENT_NAV_TABS.some((tab) => tab.id === segment)) {
    return segment as AgentNavTabId;
  }

  return null;
}

export function isAgentWorkspacePath(pathname: string): boolean {
  const publicPath = toPublicPathname(pathname);
  return /^\/agents\/(?!new(?:\/|$))[^/]+/.test(publicPath);
}

export function isAgentTabLocked(tab: AgentNavTab, orgTier: string): boolean {
  if (isOssDeployment()) return false;
  if (!tab.requiredCapability) return false;
  const capabilities = getPlanCapabilities(orgTier);
  return !capabilities[tab.requiredCapability];
}
