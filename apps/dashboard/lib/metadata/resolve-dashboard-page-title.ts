import { agentOverviewRoute, Routes } from '@/constants/routes';
import { toPublicPathname } from '@/lib/routes/public-pathname';

const EXACT_TITLES: Record<string, string> = {
  [Routes.Home]: 'Organization',
  [Routes.OrganizationTeam]: 'Team',
  [Routes.OrganizationWorkspace]: 'Workspace',
  [Routes.Agents]: 'Agents',
  [Routes.AgentNew]: 'New agent',
  [Routes.Knowledge]: 'Knowledge',
  [Routes.Integrations]: 'Integrations',
  [Routes.Analytics]: 'Analytics',
  [Routes.History]: 'History',
  [Routes.Desk]: 'Desk',
  [Routes.DeskAI]: 'Desk',
  [Routes.DeskHuman]: 'Human Desk',
  [Routes.DeskRunbooks]: 'Runbooks',
  [Routes.DeskClusters]: 'Clusters',
  [Routes.DeskEscalation]: 'Escalation',
  [Routes.DeskTeam]: 'Desk team',
  [Routes.HumanDesk]: 'Human Desk',
  [Routes.Training]: 'Training',
  [Routes.AdminTickets]: 'Support tickets',
  [Routes.Settings]: 'Settings',
  [Routes.Profile]: 'Profile',
  [Routes.Security]: 'Security',
  [Routes.Notifications]: 'Notifications',
  [Routes.OrganizationInformation]: 'Organization information',
  [Routes.Members]: 'Team members',
  [Routes.Billing]: 'Billing',
  [Routes.Developers]: 'Developers'
};

const AGENT_TAB_TITLES: Record<string, string> = {
  persona: 'Persona',
  personality: 'Persona',
  knowledge: 'Knowledge',
  runbooks: 'Runbooks',
  escalation: 'Escalation',
  analytics: 'Analytics',
  history: 'History'
};

export function resolvePublicPathname(pathname: string): string {
  return toPublicPathname(pathname);
}

export function resolveDashboardPageTitle(pathname: string): string {
  const publicPath = resolvePublicPathname(pathname);

  if (EXACT_TITLES[publicPath]) {
    return EXACT_TITLES[publicPath];
  }

  const agentMatch = publicPath.match(/^\/agents\/([^/]+)(?:\/([^/]+))?$/);
  if (agentMatch) {
    const [, agentId, tab] = agentMatch;
    if (agentId === 'new') {
      return 'New agent';
    }
    if (!tab) {
      return 'Agent';
    }
    return AGENT_TAB_TITLES[tab] ?? 'Agent';
  }

  const integrationMatch = publicPath.match(/^\/integrations\/([^/]+)$/);
  if (integrationMatch) {
    return 'Integration';
  }

  return 'Humaner';
}

export function resolveAgentPageMetadataPath(
  agentId: string,
  tab: string = 'persona'
): string {
  if (tab === 'persona' || tab === 'personality') {
    return agentOverviewRoute(agentId);
  }
  return `/agents/${agentId}/${tab}`;
}
