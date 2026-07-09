import type { LucideIcon } from '@humaner/shared/icons';
import {
  BarChart3Icon,
  BookOpenIcon,
  ClockIcon,
  FileTextIcon,
  ShieldIcon,
  UserIcon
} from '@humaner/shared/icons';

import {
  agentAnalyticsRoute,
  agentEscalationRoute,
  agentHistoryRoute,
  agentKnowledgeRoute,
  agentPersonaRoute,
  agentRunbooksRoute,
  Routes
} from '@/constants/routes';

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
};

export const AGENT_NAV_TABS: AgentNavTab[] = [
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
    href: (agentId) => agentRunbooksRoute(agentId)
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

export function getActiveAgentTab(pathname: string): AgentNavTabId | null {
  if (
    pathname === Routes.AgentNew ||
    pathname.startsWith(`${Routes.AgentNew}/`)
  ) {
    return null;
  }

  const match = pathname.match(/^\/dashboard\/agents\/[^/]+(?:\/([^/]+))?/);
  if (!match) {
    return null;
  }

  const segment = match[1];
  if (!segment || segment === 'personality') {
    return 'persona';
  }

  if (AGENT_NAV_TABS.some((tab) => tab.id === segment)) {
    return segment as AgentNavTabId;
  }

  return null;
}

export function isAgentWorkspacePath(pathname: string): boolean {
  return /^\/dashboard\/agents\/(?!new(?:\/|$))[^/]+/.test(pathname);
}
