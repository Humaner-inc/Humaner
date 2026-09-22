'use server';

import { createHash } from 'crypto';
import { revalidateTag } from 'next/cache';

import { pageActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { assertCanMutateDemoAgent } from '@/lib/admin-demos/assert-can-mutate-demo-agent';
import { prisma } from '@/lib/db/prisma';
import { decodeBase64Image } from '@/lib/imaging/decode-base64-image';
import { resizeImage } from '@/lib/imaging/resize-image';
import { invalidateAgentConfigCache } from '@/lib/redis/agent-config-cache';
import { getAgentImageUrl } from '@/lib/urls/get-agent-image-url';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateAgentImageSchema } from '@/schemas/agents/update-agent-image-schema';
import { FileUploadAction } from '@/types/file-upload-action';
import type { Maybe } from '@/types/maybe';

export const updateAgentImage = pageActionClient('agents')
  .metadata({ actionName: 'updateAgentImage' })
  .schema(updateAgentImageSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const agent = await prisma.agent.findFirst({
      where: {
        id: parsedInput.id,
        organizationId: session.user.organizationId
      },
      select: { id: true, publicId: true, role: true }
    });
    if (!agent) {
      throw new NotFoundError('Agent not found');
    }
    await assertCanMutateDemoAgent(agent.role, session.user.id);

    let imageUrl: Maybe<string> = undefined;

    if (parsedInput.action === FileUploadAction.Update && parsedInput.image) {
      const { buffer, mimeType } = decodeBase64Image(parsedInput.image);
      const data = await resizeImage(buffer, mimeType);
      const hash = createHash('sha256').update(data).digest('hex');

      await prisma.$transaction(async (tx) => {
        const images = await tx.agentImage.findMany({
          where: { agentId: parsedInput.id },
          select: { id: true }
        });
        for (const image of images) {
          await tx.agentImage.delete({ where: { id: image.id } });
        }
        await tx.agentImage.create({
          data: {
            agentId: parsedInput.id,
            data,
            contentType: mimeType,
            hash
          }
        });
      });

      imageUrl = getAgentImageUrl(parsedInput.id, hash);
    }

    if (parsedInput.action === FileUploadAction.Delete) {
      const images = await prisma.agentImage.findMany({
        where: { agentId: parsedInput.id },
        select: { id: true }
      });
      for (const image of images) {
        await prisma.agentImage.delete({ where: { id: image.id } });
      }
      imageUrl = null;
    }

    await prisma.agent.update({
      where: { id: agent.id },
      data: { image: imageUrl }
    });

    await invalidateAgentConfigCache(agent.publicId);

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.Agents,
        session.user.organizationId
      ),
      'max'
    );

    return { imageUrl: imageUrl ?? null };
  });
