import 'server-only';

import { redirect } from 'next/navigation';

import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import {
  getUserWorkspaces,
  type UserWorkspaceSummary
} from '@/lib/auth/workspace-membership';

export async function getWorkspaceSwitcherData(): Promise<
  UserWorkspaceSummary[]
> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return getUserWorkspaces(session.user.id, session.user.organizationId);
}
