'use server';

import { revalidateTag } from 'next/cache';
import { startOfDay } from 'date-fns';

import { ownerActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { generateApiKey, hashApiKey } from '@/lib/auth/api-keys';
import {
  getOrganizationCapabilities,
  getOrganizationPlanName
} from '@/lib/billing/capabilities';
import { prisma } from '@/lib/db/prisma';
import { PreConditionError } from '@/lib/validation/exceptions';
import { createApiKeySchema } from '@/schemas/api-keys/create-api-key-schema';

export const createApiKey = ownerActionClient
  .metadata({ actionName: 'createApiKey' })
  .schema(createApiKeySchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const capabilities = await getOrganizationCapabilities(
      session.user.organizationId
    );
    if (!capabilities.apiAccess) {
      const planName = await getOrganizationPlanName(
        session.user.organizationId
      );
      throw new PreConditionError(
        `REST API access is not available on the ${planName} plan. Upgrade to Push to create API keys.`
      );
    }

    const apiKey = generateApiKey();
    await prisma.apiKey.create({
      data: {
        description: parsedInput.description,
        hashedKey: hashApiKey(apiKey),
        expiresAt: parsedInput.neverExpires
          ? null
          : startOfDay(parsedInput.expiresAt ?? new Date()),
        organizationId: session.user.organizationId
      },
      select: {
        id: true // SELECT NONE
      }
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.ApiKeys,
        session.user.organizationId
      )
    );

    return { apiKey };
  });
