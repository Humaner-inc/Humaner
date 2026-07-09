import 'server-only';

import { redirect } from 'next/navigation';
import { Role, WorkspaceRole } from '@prisma/client';

import { resolvePathAccess } from '@/constants/dashboard-pages';
import type { DashboardPageKey } from '@/constants/dashboard-pages';
import { Routes } from '@/constants/routes';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { ForbiddenError } from '@/lib/validation/exceptions';

export type UserAccessContext = {
  role: Role;
  workspaceRole: WorkspaceRole;
  allowedPages: string[];
};

export async function getUserAccessContext(
  userId: string
): Promise<UserAccessContext | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: {
      role: true,
      workspaceRole: true,
      allowedPages: true
    }
  });

  if (!user) {
    return null;
  }

  return user;
}

export function canAccessPathWithContext(
  context: UserAccessContext,
  pathname: string
): boolean {
  if (context.role === Role.ADMIN) {
    return true;
  }

  const resolved = resolvePathAccess(pathname);

  switch (resolved.type) {
    case 'account':
    case 'unknown':
      return true;
    case 'owner':
      return context.workspaceRole === WorkspaceRole.OWNER;
    case 'platform-admin':
      return false;
    case 'page':
      return canAccessPageKey(context, resolved.pageKey);
    default:
      return true;
  }
}

export function canAccessPageKey(
  context: UserAccessContext,
  pageKey: DashboardPageKey
): boolean {
  if (context.role === Role.ADMIN) {
    return true;
  }

  if (context.workspaceRole === WorkspaceRole.OWNER) {
    return true;
  }

  if (context.allowedPages.includes(pageKey)) {
    return true;
  }

  if (pageKey === 'overview' && context.allowedPages.includes('agents')) {
    return true;
  }

  if (pageKey === 'agents' && context.allowedPages.includes('overview')) {
    return true;
  }

  // Desk replaced Human Desk in nav; keep legacy page keys interchangeable.
  if (pageKey === 'desk' && context.allowedPages.includes('human-desk')) {
    return true;
  }

  if (pageKey === 'human-desk' && context.allowedPages.includes('desk')) {
    return true;
  }

  return false;
}

export async function requirePathAccess(pathname: string): Promise<void> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    redirect(getLoginRedirect());
  }

  const context = await getUserAccessContext(session.user.id);
  if (!context) {
    throw new ForbiddenError('User not found');
  }

  if (!canAccessPathWithContext(context, pathname)) {
    redirect(Routes.Home);
  }
}

export async function requireWorkspaceOwnerSession(): Promise<void> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    redirect(getLoginRedirect());
  }

  const context = await getUserAccessContext(session.user.id);
  if (!context || context.workspaceRole !== WorkspaceRole.OWNER) {
    throw new ForbiddenError('Workspace owner access required');
  }
}
