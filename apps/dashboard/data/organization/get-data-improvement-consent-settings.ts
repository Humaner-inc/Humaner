import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';
import { WorkspaceRole } from '@prisma/client';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  OrganizationCacheKey
} from '@/data/caching';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { getDataImprovementConsentState } from '@/lib/consent/data-improvement-consent';
import { prisma } from '@/lib/db/prisma';

export type DataImprovementConsentSettings = {
  consent: boolean | null;
  consentedAt: string | null;
  isOwner: boolean;
};

export async function getDataImprovementConsentSettings(): Promise<DataImprovementConsentSettings> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      const [state, user] = await Promise.all([
        getDataImprovementConsentState(session.user.organizationId),
        prisma.user.findFirst({
          where: { id: session.user.id },
          select: { workspaceRole: true }
        })
      ]);

      return {
        consent: state.consent,
        consentedAt: state.consentedAt?.toISOString() ?? null,
        isOwner: user?.workspaceRole === WorkspaceRole.OWNER
      };
    },
    [
      ...Caching.createOrganizationKeyParts(
        OrganizationCacheKey.OrganizationDetails,
        session.user.organizationId
      ),
      'data-improvement-consent'
    ],
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganizationTag(
          OrganizationCacheKey.OrganizationDetails,
          session.user.organizationId
        )
      ]
    }
  )();
}
