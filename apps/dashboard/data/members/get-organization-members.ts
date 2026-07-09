import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  OrganizationCacheKey
} from '@/data/caching';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import type { MemberDto } from '@/types/dtos/member-dto';
import { SortDirection } from '@/types/sorty-direction';

/** Org members visible to any workspace member (no owner gate). */
export async function getOrganizationMembers(): Promise<MemberDto[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      const members = await prisma.organizationMembership.findMany({
        where: { organizationId: session.user.organizationId },
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
              lastLogin: true
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
        dateAdded: membership.createdAt,
        lastLogin: membership.user.lastLogin ?? undefined
      }));
    },
    Caching.createOrganizationKeyParts(
      OrganizationCacheKey.Members,
      session.user.organizationId,
      'directory'
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganizationTag(
          OrganizationCacheKey.Members,
          session.user.organizationId
        )
      ]
    }
  )();
}
