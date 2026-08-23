import { AppInfo } from '@/constants/app-info';
import { agentOverviewRoute, Routes } from '@/constants/routes';
import { isOssDeployment } from '@/lib/deployment-mode';
import { toPublicPathname } from '@/lib/routes/public-pathname';

const EXACT_TITLES: Record<string, string> = {
  [Routes.Home]: 'Organization',
  [Routes.OrganizationTeam]: 'Team',
  [Routes.Agents]: 'Agents',
  [Routes.AgentNew]: 'New agent',
  [Routes.Knowledge]: 'Knowledge',
  [Routes.Integrations]: 'Integrations',
  [Routes.Analytics]: 'Analytics',
  [Routes.History]: 'History',
  [Routes.Desk]: 'Desk',
  [Routes.DeskAgent]: 'Agent Desk',
  [Routes.DeskHuman]: 'Human Desk',
  [Routes.DeskRunbooks]: 'Runbooks',
  [Routes.DeskClusters]: 'Loops',
  [Routes.DeskEscalation]: 'Escalation',
  [Routes.DeskTeam]: 'Desk team',
  [Routes.HumanDesk]: 'Human Desk',
  [Routes.Inbox]: 'Mails',
  [Routes.InboxAll]: 'Inbox',
  [Routes.InboxAssigned]: 'Assigned to me',
  [Routes.InboxArchive]: 'Archive',
  [Routes.InboxAliases]: 'Aliases',
  [Routes.InboxProviders]: 'Providers',
  [Routes.InboxTags]: 'Tags',
  [Routes.Training]: 'Training',
  [Routes.AdminTickets]: 'Support tickets',
  [Routes.AdminDemos]: 'Demo agents',
  [Routes.Settings]: 'Settings',
  [Routes.Profile]: 'Profile',
  [Routes.Security]: 'Security',
  [Routes.Notifications]: 'Notifications',
  [Routes.OrganizationInformation]: 'Workspace settings',
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

export function stripSearchAndHash(pathname: string): string {
  const withoutHash = pathname.split('#')[0] ?? pathname;
  return withoutHash.split('?')[0] ?? withoutHash;
}

export function resolveDashboardPageTitle(pathname: string): string {
  const publicPath = stripSearchAndHash(resolvePublicPathname(pathname));

  if (
    isOssDeployment() &&
    (publicPath === Routes.DeskHuman || publicPath === Routes.HumanDesk)
  ) {
    return 'Helpdesk';
  }

  if (isOssDeployment() && publicPath === Routes.Desk) {
    return 'Helpdesk';
  }

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

  if (publicPath.startsWith('/inbox/threads/')) {
    return 'Mails';
  }

  return AppInfo.APP_NAME;
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
