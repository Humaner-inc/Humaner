'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateWebhookSchema } from '@/schemas/webhooks/update-webhook-schema';

export const updateWebhook = authActionClient
  .metadata({ actionName: 'updateWebhook' })
  .schema(updateWebhookSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const count = await prisma.webhook.count({
      where: {
        organizationId: session.user.organizationId,
        id: parsedInput.id
      }
    });
    if (count < 1) {
      throw new NotFoundError('Webhook not found');
    }

    await prisma.webhook.update({
      where: {
        id: parsedInput.id,
        organizationId: session.user.organizationId
      },
      data: {
        url: parsedInput.url,
        triggers: parsedInput.triggers ? parsedInput.triggers : [],
        secret: parsedInput.secret ? parsedInput.secret : null
      },
      select: {
        id: true // SELECT NONE
      }
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.Webhooks,
        session.user.organizationId
      )
    );
  });
