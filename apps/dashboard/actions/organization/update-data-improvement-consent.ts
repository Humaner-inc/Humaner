'use server';

import { revalidateTag } from 'next/cache';
import { WorkspaceRole } from '@prisma/client';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { ForbiddenError, NotFoundError } from '@/lib/validation/exceptions';
import { updateDataImprovementConsentSchema } from '@/schemas/organization/update-data-improvement-consent-schema';

export const updateDataImprovementConsent = authActionClient
  .metadata({ actionName: 'updateDataImprovementConsent' })
  .schema(updateDataImprovementConsentSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      throw new NotFoundError('Organization not found');
    }

    const membership = await prisma.user.findFirst({
      where: { id: session.user.id },
      select: { workspaceRole: true }
    });

    if (membership?.workspaceRole !== WorkspaceRole.OWNER) {
      throw new ForbiddenError(
        'Only the workspace owner can update data improvement settings.'
      );
    }

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        dataImprovementConsent: parsedInput.consent,
        dataImprovementConsentAt: new Date(),
        dataImprovementConsentById: session.user.id
      }
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.OrganizationDetails,
        organizationId
      )
    );

    return { consent: parsedInput.consent };
  });
