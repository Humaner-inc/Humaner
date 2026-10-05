import { Routes } from '@/constants/routes';

export type WorkspaceSettingsTab = 'inbox' | 'companion' | 'connect' | 'data';

export function resolveWorkspaceSettingsTab(
  value: string | undefined
): WorkspaceSettingsTab {
  if (value === 'companion') return 'companion';
  if (value === 'connect') return 'connect';
  if (value === 'data' || value === 'settings') return 'data';
  return 'inbox';
}

export function workspaceSettingsHref(tab: WorkspaceSettingsTab): string {
  if (tab === 'inbox') return Routes.OrganizationWorkspace;
  return `${Routes.OrganizationWorkspace}?tab=${tab}`;
}
