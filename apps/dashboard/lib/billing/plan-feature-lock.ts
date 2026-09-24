import {
  getPlanCapabilities,
  type PlanCapabilities
} from '@humaner/shared/plans';

import { Routes } from '@/constants/routes';
import { toPublicPathname } from '@/lib/routes/public-pathname';

export type LockedWorkspaceFeature =
  | 'tasks'
  | 'resources'
  | 'mcp'
  | 'companion';

export function resolveLockedWorkspaceFeature(
  pathname: string,
  capabilities: Pick<
    PlanCapabilities,
    'tasks' | 'resources' | 'mcp' | 'copilot'
  >
): LockedWorkspaceFeature | null {
  const path = toPublicPathname(pathname);

  if (
    (path.startsWith(Routes.Tasks) || path.startsWith('/tasks')) &&
    !capabilities.tasks
  ) {
    return 'tasks';
  }

  if (
    (path.startsWith(Routes.Resources) || path.startsWith('/resources')) &&
    !capabilities.resources
  ) {
    return 'resources';
  }

  if (path.startsWith(Routes.Developers) && !capabilities.mcp) {
    return 'mcp';
  }

  if (
    (path.startsWith(Routes.Knowledge) || path.startsWith('/knowledge')) &&
    !capabilities.copilot
  ) {
    return 'companion';
  }

  return null;
}

export function resolveLockedWorkspaceFeatureForTier(
  pathname: string,
  tier: string
): LockedWorkspaceFeature | null {
  return resolveLockedWorkspaceFeature(pathname, getPlanCapabilities(tier));
}

export const LOCKED_FEATURE_COPY: Record<
  LockedWorkspaceFeature,
  { title: string; body: string }
> = {
  tasks: {
    title: 'Tasks are on Inbox',
    body: 'Start the 7-day Inbox trial to create and assign work.'
  },
  resources: {
    title: 'Resources are on Inbox',
    body: 'Companion retrieves from these sources on the Inbox trial.'
  },
  mcp: {
    title: 'MCP is on Inbox',
    body: 'Point your own agent at the mailbox on the Inbox trial.'
  },
  companion: {
    title: 'Companion is on Inbox',
    body: 'Start the trial to draft, assign, and remember from the mailbox.'
  }
};
