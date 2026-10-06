import { NextResponse, type NextRequest } from 'next/server';
import { validate as uuidValidate } from 'uuid';

import { dedupedAuth } from '@/lib/auth';
import { userCanAccessDashboardPage } from '@/lib/auth/require-workspace-access';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { safeMailMediaType } from '@/lib/inbox/imap-body-parts';
import {
  mailThreadAccessWhere,
  resolveMailAliasScope
} from '@/lib/inbox/mail-alias-scope';
import { contentDispositionAttachment } from '@/lib/inbox/mail-attachment-format';
import {
  MAIL_ATTACHMENT_MAX_STORED_BYTES,
  readMailAttachment
} from '@/lib/inbox/mail-attachment-storage';
import { readImapAttachmentPart } from '@/lib/inbox/read-imap-attachment';

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return new NextResponse(undefined, { status: 401 });
  }
  if (!(await userCanAccessDashboardPage(session.user.id, 'inbox'))) {
    return new NextResponse(undefined, { status: 403 });
  }

  const { id } = await props.params;
  if (!id || !uuidValidate(id)) {
    return new NextResponse(undefined, { status: 400 });
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) {
    return new NextResponse(undefined, { status: 404 });
  }

  const scope = await resolveMailAliasScope({
    userId: session.user.id,
    organizationId
  });
  const attachment = await prisma.mailMessageAttachment.findFirst({
    where: {
      id,
      organizationId,
      message: {
        thread: mailThreadAccessWhere({
          organizationId,
          userId: session.user.id,
          scope
        })
      }
    },
    select: {
      filename: true,
      mediaType: true,
      storageKey: true,
      imapPartId: true,
      sizeBytes: true
    }
  });
  if (!attachment) {
    return new NextResponse(undefined, { status: 404 });
  }

  if (!attachment.storageKey && attachment.imapPartId) {
    if (attachment.sizeBytes > MAIL_ATTACHMENT_MAX_STORED_BYTES) {
      return new NextResponse(undefined, { status: 413 });
    }
    const part = await readImapAttachmentPart(id, organizationId);
    if (!part) {
      return new NextResponse(undefined, { status: 404 });
    }
    return new NextResponse(new Uint8Array(part.body), {
      status: 200,
      headers: {
        'Content-Type': safeMailMediaType(
          part.contentType || attachment.mediaType
        ),
        'Content-Length': part.body.byteLength.toString(),
        'Content-Disposition': contentDispositionAttachment(part.filename),
        'Cache-Control': 'private, no-store'
      }
    });
  }

  if (!attachment.storageKey) {
    return new NextResponse(undefined, { status: 404 });
  }

  const stored = await readMailAttachment(attachment.storageKey);
  if (!stored) {
    return new NextResponse(undefined, { status: 404 });
  }

  return new NextResponse(stored.body, {
    status: 200,
    headers: {
      'Content-Type': safeMailMediaType(
        stored.contentType || attachment.mediaType
      ),
      'Content-Length': stored.body.byteLength.toString(),
      'Content-Disposition': contentDispositionAttachment(attachment.filename),
      'Cache-Control': 'private, no-store'
    }
  });
}
