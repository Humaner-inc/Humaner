import 'server-only';

import { MailConnectionStatus, MailProvider } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import {
  isImapMailboxPath,
  isImapPartId,
  safeMailMediaType
} from '@/lib/inbox/imap-body-parts';
import { withImapMailboxLock } from '@/lib/inbox/imap-mailbox-lock';
import { MAIL_ATTACHMENT_MAX_STORED_BYTES } from '@/lib/inbox/mail-attachment-storage';
import { validateMailEndpoints } from '@/lib/inbox/validate-mail-endpoint';
import { decryptSensitiveField } from '@/lib/security/sensitive-fields';

// fetch one attachment part for this workspace, capped like stored uploads
export async function readImapAttachmentPart(
  attachmentId: string,
  organizationId: string
): Promise<{ body: Buffer; contentType: string; filename: string } | null> {
  const attachment = await prisma.mailMessageAttachment.findFirst({
    where: { id: attachmentId, organizationId, imapPartId: { not: null } },
    select: {
      filename: true,
      mediaType: true,
      sizeBytes: true,
      imapPartId: true,
      message: {
        select: {
          imapUid: true,
          imapFolderPath: true,
          thread: {
            select: {
              alias: {
                select: {
                  connection: {
                    select: {
                      id: true,
                      provider: true,
                      status: true,
                      imapHost: true,
                      imapPort: true,
                      imapUser: true,
                      imapPassword: true,
                      imapTls: true,
                      smtpHost: true,
                      smtpPort: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  const partId = attachment?.imapPartId;
  const uid = attachment?.message.imapUid;
  const folderPath = attachment?.message.imapFolderPath;
  const connection = attachment?.message.thread.alias.connection;
  if (
    !attachment ||
    !partId ||
    uid == null ||
    !folderPath ||
    !isImapPartId(partId) ||
    !isImapMailboxPath(folderPath) ||
    !connection ||
    connection.provider !== MailProvider.IMAP ||
    connection.status !== MailConnectionStatus.ACTIVE ||
    attachment.sizeBytes > MAIL_ATTACHMENT_MAX_STORED_BYTES
  ) {
    return null;
  }

  return withImapMailboxLock(connection.id, async () => {
    const imapHost = decryptSensitiveField(connection.imapHost);
    const imapUser = decryptSensitiveField(connection.imapUser);
    const imapPassword = decryptSensitiveField(connection.imapPassword);
    const smtpHost = decryptSensitiveField(connection.smtpHost);
    if (
      !imapHost ||
      !imapUser ||
      !imapPassword ||
      !connection.imapPort ||
      !smtpHost ||
      !connection.smtpPort
    ) {
      return null;
    }

    const validatedHosts = await validateMailEndpoints({
      imapHost,
      imapPort: connection.imapPort,
      smtpHost,
      smtpPort: connection.smtpPort
    });
    const { ImapFlow } = await import('imapflow');
    const client = new ImapFlow({
      host: validatedHosts.imap.address,
      servername: validatedHosts.imap.hostname,
      port: connection.imapPort,
      secure: connection.imapTls,
      auth: { user: imapUser, pass: imapPassword },
      logger: false,
      tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000
    });

    try {
      await client.connect();
      await client.mailboxOpen(folderPath);
      const downloaded = await client.download(String(uid), partId, {
        uid: true,
        maxBytes: MAIL_ATTACHMENT_MAX_STORED_BYTES
      });
      if (!downloaded?.content) {
        await client.logout();
        return null;
      }

      const chunks: Buffer[] = [];
      let total = 0;
      for await (const chunk of downloaded.content) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        total += buf.length;
        if (total > MAIL_ATTACHMENT_MAX_STORED_BYTES) {
          await client.logout();
          return null;
        }
        chunks.push(buf);
      }
      await client.logout();
      return {
        body: Buffer.concat(chunks),
        contentType: safeMailMediaType(attachment.mediaType),
        filename: attachment.filename
      };
    } catch (error) {
      try {
        await client.close();
      } catch {
        // ignore cleanup errors
      }
      console.error(
        '[imap] attachment download failed',
        error instanceof Error ? error.message : error
      );
      return null;
    }
  });
}
