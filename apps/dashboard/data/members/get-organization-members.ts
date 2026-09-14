import 'server-only';

import { unstable_cache as cache, revalidateTag } from 'next/cache';
import { WorkspaceRole } from '@prisma/client';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  OrganizationCacheKey
} from '@/data/caching';
import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { createOrganizationMembership } from '@/lib/auth/workspace-membership';
import { prisma } from '@/lib/db/prisma';
import type { MemberDto } from '@/types/dtos/member-dto';
import { SortDirection } from '@/types/sorty-direction';

/**
 * Heal missing membership for users whose `organizationId` points here without
 * a membership row. The /team list is membership-scoped — without this,
 * invitees can reach the dashboard but never appear (including themselves).
 */
async function ensureMembershipRows(organizationId: string): Promise<boolean> {
  const orphans = await prisma.user.findMany({
    where: {
      organizationId,
      organizationMemberships: {
        none: { organizationId }
      }
    },
    select: {
      id: true,
      workspaceRole: true,
      allowedPages: true
    }
  });

  if (orphans.length === 0) {
    return false;
  }

  await Promise.all(
    orphans.map((user) =>
      createOrganizationMembership({
        userId: user.id,
        organizationId,
        workspaceRole: user.workspaceRole ?? WorkspaceRole.TEAMMATE,
        allowedPages: user.allowedPages
      })
    )
  );

  revalidateTag(
    Caching.createOrganizationTag(OrganizationCacheKey.Members, organizationId),
    'max'
  );
  return true;
}

async function loadOrganizationMembers(
  organizationId: string
): Promise<MemberDto[]> {
  const members = await prisma.organizationMembership.findMany({
    where: { organizationId },
    select: {
      workspaceRole: true,
      allowedPages: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          image: true,
          name: true,
          email: true,
          role: true,
          lastLogin: true,
          timeZone: true
        }
      }
    },
    orderBy: {
      createdAt: SortDirection.Asc
    }
  });

  return members.map((membership) => ({
    id: membership.user.id,
    image: membership.user.image ?? undefined,
    name: membership.user.name,
    email: membership.user.email!,
    role: membership.user.role,
    workspaceRole: membership.workspaceRole,
    allowedPages: membership.allowedPages,
    timeZone: membership.user.timeZone,
    dateAdded: membership.createdAt,
    lastLogin: membership.user.lastLogin ?? undefined
  }));
}

/** Org members visible to any workspace member (no owner gate). */
export async function getOrganizationMembers(): Promise<MemberDto[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return [];
  }

  const organizationId = session.user.organizationId;
  const healed = await ensureMembershipRows(organizationId);

  // Fresh read after healing — unstable_cache may still serve the stale list
  // in the same request even after revalidateTag.
  if (healed) {
    return loadOrganizationMembers(organizationId);
  }

  return cache(
    () => loadOrganizationMembers(organizationId),
    Caching.createOrganizationKeyParts(
      OrganizationCacheKey.Members,
      organizationId,
      'directory'
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganizationTag(
          OrganizationCacheKey.Members,
          organizationId
        )
      ]
    }
  )();
}
