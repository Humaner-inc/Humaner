import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';
import type { SourceType, SyncStatus } from '@prisma/client';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  OrganizationCacheKey
} from '@/data/caching';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export type KnowledgeSourceItem = {
  id: string;
  type: SourceType;
  title: string;
  url: string | null;
  status: SyncStatus;
  pageCount: number | null;
  lastSyncedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
};

export async function getKnowledgeSources(
  agentId: string
): Promise<KnowledgeSourceItem[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      return prisma.knowledgeSource.findMany({
        where: {
          agentId,
          agent: { organizationId: session.user.organizationId }
        },
        select: {
          id: true,
          type: true,
          title: true,
          url: true,
          status: true,
          pageCount: true,
          lastSyncedAt: true,
          errorMessage: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
    },
    Caching.createOrganizationKeyParts(
      OrganizationCacheKey.KnowledgeSources,
      session.user.organizationId,
      agentId
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganizationTag(
          OrganizationCacheKey.KnowledgeSources,
          session.user.organizationId,
          agentId
        )
      ]
    }
  )();
}
