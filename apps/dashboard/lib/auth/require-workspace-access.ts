import 'server-only';

import { cache } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { Role, WorkspaceRole } from '@prisma/client';

import {
  resolvePathAccess,
  resolveTeammateAccessLevel
} from '@/constants/dashboard-pages';
import type { DashboardPageKey } from '@/constants/dashboard-pages';
import { sharesHandoffDeskAccess } from '@/constants/handoff-desk-pages';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { getSignedInHomePath } from '@/lib/routes/signed-in-home';
import { ForbiddenError } from '@/lib/validation/exceptions';

export type UserAccessContext = {
  role: Role;
  workspaceRole: WorkspaceRole;
  allowedPages: string[];
};

export const getUserAccessContext = cache(
  async (userId: string): Promise<UserAccessContext | null> => {
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: {
        role: true,
        organizationId: true,
        organizationMemberships: {
          select: {
            organizationId: true,
            workspaceRole: true,
            allowedPages: true
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    const membership = user.organizationMemberships.find(
      (row) => row.organizationId === user.organizationId
    );

    return {
      role: user.role,
      workspaceRole: membership?.workspaceRole ?? WorkspaceRole.TEAMMATE,
      allowedPages: membership?.allowedPages ?? []
    };
  }
);

export async function userCanAccessDashboardPage(
  userId: string,
  pageKey: DashboardPageKey
): Promise<boolean> {
  const context = await getUserAccessContext(userId);
  return Boolean(context && canAccessPageKey(context, pageKey));
}

export async function userCanAccessAnyDashboardPage(
  userId: string,
  pageKeys: DashboardPageKey[]
): Promise<boolean> {
  const context = await getUserAccessContext(userId);
  return Boolean(
    context && pageKeys.some((pageKey) => canAccessPageKey(context, pageKey))
  );
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
    case 'workspace-admin':
      return (
        context.workspaceRole === WorkspaceRole.OWNER ||
        resolveTeammateAccessLevel(context.allowedPages) === 'admin'
      );
    case 'platform-admin':
      return false;
    case 'page':
      return canAccessPageKey(context, resolved.pageKey);
    default:
      return true;
  }
}

const PLATFORM_ADMIN_PAGE_KEYS = new Set<DashboardPageKey>([
  'support',
  'workflow'
]);

export function canAccessPageKey(
  context: UserAccessContext,
  pageKey: DashboardPageKey
): boolean {
  if (context.role === Role.ADMIN) {
    return true;
  }

  if (PLATFORM_ADMIN_PAGE_KEYS.has(pageKey)) {
    return false;
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

  if (sharesHandoffDeskAccess(context.allowedPages, pageKey)) {
    return true;
  }

  if (
    (pageKey === 'tasks' || pageKey === 'calendar') &&
    context.allowedPages.includes('inbox')
  ) {
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
    redirect(getSignedInHomePath());
  }
}

// Role.ADMIN only — workspace owner is not enough
export async function requirePlatformAdminOrRedirect(): Promise<void> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    redirect(getLoginRedirect());
  }

  const context = await getUserAccessContext(session.user.id);
  if (!context || context.role !== Role.ADMIN) {
    redirect(getSignedInHomePath());
  }
}

/** RSC layouts: gate using the pathname stamped by proxy. */
export async function requirePathAccessFromHeaders(): Promise<void> {
  const pathname = (await headers()).get('x-pathname');
  if (!pathname || pathname.startsWith('/api/')) {
    return;
  }

  await requirePathAccess(pathname);
}

/** Data loaders: stop ticket/mail/history queries before they run. */
export async function requireDashboardPageOrRedirect(
  pageKey: DashboardPageKey
): Promise<void> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    redirect(getLoginRedirect());
  }

  if (!(await userCanAccessDashboardPage(session.user.id, pageKey))) {
    redirect(getSignedInHomePath());
  }
}

export async function requireAnyDashboardPageOrRedirect(
  pageKeys: DashboardPageKey[]
): Promise<void> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    redirect(getLoginRedirect());
  }

  if (!(await userCanAccessAnyDashboardPage(session.user.id, pageKeys))) {
    redirect(getSignedInHomePath());
  }
}

export async function requireApiDashboardPageAccess(
  pageKey: DashboardPageKey
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    };
  }

  if (!(await userCanAccessDashboardPage(session.user.id, pageKey))) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    };
  }

  return { ok: true };
}

export async function requireWorkspaceOwnerSession(): Promise<void> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    redirect(getLoginRedirect());
  }

  const { requireWorkspaceOwner } = await import(
    '@/lib/auth/workspace-permissions'
  );
  await requireWorkspaceOwner(session.user.id, session.user.organizationId);
}
