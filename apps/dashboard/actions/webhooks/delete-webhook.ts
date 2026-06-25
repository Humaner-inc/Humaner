'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { deleteWebhookSchema } from '@/schemas/webhooks/delete-webhook-schema';

export const deleteWebhook = authActionClient
  .metadata({ actionName: 'deleteWebhook' })
  .schema(deleteWebhookSchema)
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

    await prisma.webhook.delete({
      where: { id: parsedInput.id },
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
