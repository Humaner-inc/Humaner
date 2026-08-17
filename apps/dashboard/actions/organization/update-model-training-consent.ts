'use server';

import { revalidateTag } from 'next/cache';
import { WorkspaceRole } from '@prisma/client';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { ForbiddenError, NotFoundError } from '@/lib/validation/exceptions';
import { updateModelTrainingConsentSchema } from '@/schemas/organization/update-model-training-consent-schema';

export const updateModelTrainingConsent = authActionClient
  .metadata({ actionName: 'updateModelTrainingConsent' })
  .schema(updateModelTrainingConsentSchema)
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
        'Only the workspace owner can update model training settings.'
      );
    }

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        modelTrainingConsent: parsedInput.consent,
        modelTrainingConsentAt: new Date(),
        modelTrainingConsentById: session.user.id
      }
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.OrganizationDetails,
        organizationId
      ),
      'max'
    );

    return { consent: parsedInput.consent };
  });
