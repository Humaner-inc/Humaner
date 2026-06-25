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
import type { WebhookDto } from '@/types/dtos/webhook-dto';
import { SortDirection } from '@/types/sorty-direction';

export async function getWebhooks(): Promise<WebhookDto[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      const webhooks = await prisma.webhook.findMany({
        where: { organizationId: session.user.organizationId },
        select: {
          id: true,
          url: true,
          triggers: true,
          secret: true
        },
        orderBy: {
          createdAt: SortDirection.Asc
        }
      });

      const response: WebhookDto[] = webhooks.map((webhook) => ({
        id: webhook.id,
        url: webhook.url,
        triggers: webhook.triggers,
        secret: webhook.secret ?? undefined
      }));

      return response;
    },
    Caching.createOrganizationKeyParts(
      OrganizationCacheKey.Webhooks,
      session.user.organizationId
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganizationTag(
          OrganizationCacheKey.Webhooks,
          session.user.organizationId
        )
      ]
    }
  )();
}
