'use server';

import { createHash } from 'crypto';
import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey, UserCacheKey } from '@/data/caching';
import { updateContactAndCaptureEvent } from '@/lib/db/contact-event-capture';
import { prisma } from '@/lib/db/prisma';
import { decodeBase64Image } from '@/lib/imaging/decode-base64-image';
import { resizeImage } from '@/lib/imaging/resize-image';
import { getContactImageUrl } from '@/lib/urls/get-contact-image-url';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateContactImageSchema } from '@/schemas/contacts/update-contact-image-schema';
import { FileUploadAction } from '@/types/file-upload-action';
import type { Maybe } from '@/types/maybe';

export const updateContactImage = authActionClient
  .metadata({ actionName: 'updateContactImage' })
  .schema(updateContactImageSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const count = await prisma.contact.count({
      where: {
        organizationId: session.user.organizationId,
        id: parsedInput.id
      }
    });
    if (count < 1) {
      throw new NotFoundError('Contact not found');
    }

    let imageUrl: Maybe<string> = undefined;

    if (parsedInput.action === FileUploadAction.Update && parsedInput.image) {
      const { buffer, mimeType } = decodeBase64Image(parsedInput.image);
      const data = await resizeImage(buffer, mimeType);
      const hash = createHash('sha256').update(data).digest('hex');

      await prisma.$transaction([
        prisma.contactImage.deleteMany({
          where: { contactId: parsedInput.id }
        }),
        prisma.contactImage.create({
          data: {
            contactId: parsedInput.id,
            data,
            contentType: mimeType,
            hash
          }
        })
      ]);

      imageUrl = getContactImageUrl(parsedInput.id, hash);
    }
    if (parsedInput.action === FileUploadAction.Delete) {
      await prisma.contactImage.deleteMany({
        where: { contactId: parsedInput.id }
      });

      imageUrl = null;
    }

    await updateContactAndCaptureEvent(
      parsedInput.id,
      { image: imageUrl },
      session.user.id
    );

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.Contacts,
        session.user.organizationId
      )
    );
    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.Contact,
        session.user.organizationId,
        parsedInput.id
      )
    );
    revalidateTag(
      Caching.createUserTag(UserCacheKey.Favorites, session.user.id)
    );
  });
