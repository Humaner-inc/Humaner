'use server';

import { revalidateTag } from 'next/cache';

import { ownerActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import {
  getOrganizationCapabilities,
  getOrganizationPlanName
} from '@/lib/billing/capabilities';
import { prisma } from '@/lib/db/prisma';
import { encryptSensitiveField } from '@/lib/security/sensitive-fields';
import { PreConditionError } from '@/lib/validation/exceptions';
import { createWebhookSchema } from '@/schemas/webhooks/create-webhook-schema';

export const createWebhook = ownerActionClient
  .metadata({ actionName: 'createWebhook' })
  .schema(createWebhookSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const capabilities = await getOrganizationCapabilities(
      session.user.organizationId
    );
    if (!capabilities.liveData) {
      const planName = await getOrganizationPlanName(
        session.user.organizationId
      );
      throw new PreConditionError(
        `Outbound webhooks are not available on the ${planName} plan. Upgrade to Humaner.`
      );
    }

    await prisma.webhook.create({
      data: {
        organizationId: session.user.organizationId,
        url: parsedInput.url,
        triggers: parsedInput.triggers ? parsedInput.triggers : [],
        secret: encryptSensitiveField(parsedInput.secret)
      },
      select: {
        id: true // SELECT NONE
      }
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.Webhooks,
        session.user.organizationId
      ),
      'max'
    );
  });
