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
import { SortDirection } from '@/types/sorty-direction';

export type McpOAuthGrantDto = {
  id: string;
  clientName: string;
  scopes: string[];
  lastUsedAt?: Date;
  createdAt: Date;
};

export async function getMcpOAuthGrants(): Promise<McpOAuthGrantDto[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      const grants = await prisma.mcpOAuthGrant.findMany({
        where: {
          organizationId: session.user.organizationId,
          revokedAt: null,
          accessTokenHash: { not: null }
        },
        select: {
          id: true,
          scopes: true,
          lastUsedAt: true,
          createdAt: true,
          client: {
            select: { clientName: true }
          }
        },
        orderBy: { createdAt: SortDirection.Desc }
      });

      return grants.map((grant) => ({
        id: grant.id,
        clientName: grant.client.clientName,
        scopes: grant.scopes,
        lastUsedAt: grant.lastUsedAt ?? undefined,
        createdAt: grant.createdAt
      }));
    },
    Caching.createOrganizationKeyParts(
      OrganizationCacheKey.McpOAuthGrants,
      session.user.organizationId
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganizationTag(
          OrganizationCacheKey.McpOAuthGrants,
          session.user.organizationId
        )
      ]
    }
  )();
}
