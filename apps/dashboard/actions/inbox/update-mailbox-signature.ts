'use server';

import { createHash } from 'crypto';
import { revalidatePath } from 'next/cache';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import {
  decodeSignatureIconDataUrl,
  prepareSignatureIconForStorage
} from '@/lib/inbox/mailbox-signature';
import { getMailboxSignatureIconUrl } from '@/lib/urls/get-mailbox-signature-icon-url';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateMailboxSignatureSchema } from '@/schemas/inbox/update-mailbox-signature-schema';
import { FileUploadAction } from '@/types/file-upload-action';

export const updateMailboxSignature = pageActionClient('inbox')
  .metadata({ actionName: 'updateMailboxSignature' })
  .schema(updateMailboxSignatureSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;

    const connection = await prisma.mailboxConnection.findFirst({
      where: { id: parsedInput.connectionId, organizationId },
      select: {
        id: true,
        signatureIconHash: true
      }
    });
    if (!connection) {
      throw new NotFoundError('Mailbox not found');
    }

    const signatureText =
      parsedInput.signatureText === undefined
        ? undefined
        : parsedInput.signatureText.trim() || null;

    const data: {
      signatureText?: string | null;
      signatureIconData?: Buffer | null;
      signatureIconContentType?: string | null;
      signatureIconHash?: string | null;
    } = {};

    if (signatureText !== undefined) {
      data.signatureText = signatureText;
    }

    let signatureIconUrl: string | null | undefined;

    if (
      parsedInput.iconAction === FileUploadAction.Update &&
      parsedInput.icon
    ) {
      const { buffer, mimeType } = decodeSignatureIconDataUrl(parsedInput.icon);
      const prepared = await prepareSignatureIconForStorage(buffer, mimeType);
      const hash = createHash('sha256').update(prepared.data).digest('hex');
      data.signatureIconData = prepared.data;
      data.signatureIconContentType = prepared.contentType;
      data.signatureIconHash = hash;
      signatureIconUrl = getMailboxSignatureIconUrl(connection.id, hash);
    }

    if (parsedInput.iconAction === FileUploadAction.Delete) {
      data.signatureIconData = null;
      data.signatureIconContentType = null;
      data.signatureIconHash = null;
      signatureIconUrl = null;
    }

    const updated = await prisma.mailboxConnection.update({
      where: { id: connection.id },
      data,
      select: {
        signatureText: true,
        signatureIconHash: true
      }
    });

    revalidatePath(Routes.InboxSettings);
    revalidatePath(Routes.InboxProviders);

    return {
      signatureText: updated.signatureText,
      signatureIconUrl:
        signatureIconUrl !== undefined
          ? signatureIconUrl
          : updated.signatureIconHash
            ? getMailboxSignatureIconUrl(
                connection.id,
                updated.signatureIconHash
              )
            : null
    };
  });
