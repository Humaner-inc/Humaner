'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getVerticalConfig } from '@/services/training/verticals';

import { ownerActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError, PreConditionError } from '@/lib/validation/exceptions';
import { updateOrganizationVerticalTopicsSchema } from '@/schemas/organization/update-organization-vertical-topics-schema';

export const updateOrganizationVerticalTopics = ownerActionClient
  .metadata({ actionName: 'updateOrganizationVerticalTopics' })
  .schema(updateOrganizationVerticalTopicsSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organization = await prisma.organization.findFirst({
      where: { id: session.user.organizationId },
      select: { id: true, industry: true }
    });
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }
    if (!organization.industry) {
      throw new PreConditionError('Set an industry before selecting topics');
    }

    const catalog = new Set(
      getVerticalConfig(organization.industry).commonTopics
    );
    const topics = parsedInput.topics.filter((topic) => catalog.has(topic));

    await prisma.$transaction([
      prisma.organization.update({
        where: { id: session.user.organizationId },
        data: { verticalTopics: topics },
        select: { id: true }
      }),
      // Keep agent training focus aligned with workspace selection.
      prisma.agent.updateMany({
        where: { organizationId: session.user.organizationId },
        data: { trainingTopics: topics }
      })
    ]);

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.OrganizationDetails,
        session.user.organizationId
      )
    );
    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.Industry,
        session.user.organizationId
      )
    );
    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.Agents,
        session.user.organizationId
      )
    );
    revalidatePath('/dashboard', 'layout');
  });
