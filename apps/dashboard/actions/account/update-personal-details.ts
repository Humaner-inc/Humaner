'use server';

import { createHash } from 'crypto';
import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey, UserCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { deleteUserImagesForUser } from '@/lib/db/unique-mutations';
import { decodeBase64Image } from '@/lib/imaging/decode-base64-image';
import { resizeImage } from '@/lib/imaging/resize-image';
import { getUserImageUrl } from '@/lib/urls/get-user-image-url';
import { updatePersonalDetailsSchema } from '@/schemas/account/update-personal-details-schema';
import { FileUploadAction } from '@/types/file-upload-action';
import type { Maybe } from '@/types/maybe';

export const updatePersonalDetails = authActionClient
  .metadata({ actionName: 'updatePersonalDetails' })
  .schema(updatePersonalDetailsSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    let imageUrl: Maybe<string> = undefined;
    let nextImage: { data: Buffer; mimeType: string; hash: string } | undefined;

    if (parsedInput.action === FileUploadAction.Update && parsedInput.image) {
      const { buffer, mimeType } = decodeBase64Image(parsedInput.image);
      const data = await resizeImage(buffer, mimeType);
      nextImage = {
        data,
        mimeType,
        hash: createHash('sha256').update(data).digest('hex')
      };
      imageUrl = getUserImageUrl(session.user.id, nextImage.hash);
    }
    if (parsedInput.action === FileUploadAction.Delete) {
      imageUrl = null;
    }

    await prisma.$transaction(async (tx) => {
      if (nextImage) {
        await deleteUserImagesForUser(tx, session.user.id);
        await tx.userImage.create({
          data: {
            userId: session.user.id,
            data: nextImage.data,
            contentType: nextImage.mimeType,
            hash: nextImage.hash
          }
        });
      }
      if (parsedInput.action === FileUploadAction.Delete) {
        await deleteUserImagesForUser(tx, session.user.id);
      }

      await tx.user.update({
        where: { id: session.user.id },
        data: {
          image: imageUrl,
          name: parsedInput.name,
          phone: parsedInput.phone
        },
        select: {
          id: true
        }
      });
    });

    revalidateTag(
      Caching.createUserTag(UserCacheKey.PersonalDetails, session.user.id),
      'max'
    );
    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.Members,
        session.user.organizationId
      ),
      'max'
    );
  });
