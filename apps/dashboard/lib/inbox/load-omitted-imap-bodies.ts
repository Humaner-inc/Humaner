import 'server-only';

import { fetchTextSourceForUid } from '@/services/inbox/imap-folder-pass';
import {
  isImapAuthError,
  markMailboxNeedsReauth
} from '@/services/inbox/sync-imap-mailboxes';
import { MailConnectionStatus, MailProvider } from '@prisma/client';
import { simpleParser } from 'mailparser';

import { prisma } from '@/lib/db/prisma';
import {
  IMAP_BODY_TOO_LARGE_TEXT,
  IMAP_ON_DEMAND_TEXT_BYTES,
  isImapMailboxPath
} from '@/lib/inbox/imap-body-parts';
import { withImapMailboxLock } from '@/lib/inbox/imap-mailbox-lock';
import { resolveStoredMailBodies } from '@/lib/inbox/sanitize-mail-html';
import { validateMailEndpoints } from '@/lib/inbox/validate-mail-endpoint';
import { decryptSensitiveField } from '@/lib/security/sensitive-fields';

export type LoadedMailBody = {
  bodyText: string | null;
  bodyHtml: string | null;
};

type ConnectionRow = {
  id: string;
  imapHost: string | null;
  imapPort: number | null;
  imapUser: string | null;
  imapPassword: string | null;
  imapTls: boolean;
  smtpHost: string | null;
  smtpPort: number | null;
};

// fetch text for envelopes that were over the sync cap
export async function loadOmittedImapBodies(
  messageIds: string[],
  organizationId: string
): Promise<Map<string, LoadedMailBody>> {
  const loaded = new Map<string, LoadedMailBody>();
  if (messageIds.length === 0) return loaded;

  const rows = await prisma.mailMessage.findMany({
    where: {
      id: { in: messageIds },
      bodyOmitted: true,
      imapUid: { not: null },
      imapFolderPath: { not: null },
      thread: { organizationId }
    },
    select: {
      id: true,
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
  });

  const byConnection = new Map<
    string,
    { connection: ConnectionRow; messages: typeof rows }
  >();
  for (const row of rows) {
    const connection = row.thread.alias.connection;
    if (
      connection.provider !== MailProvider.IMAP ||
      connection.status !== MailConnectionStatus.ACTIVE ||
      row.imapUid == null ||
      !row.imapFolderPath
    ) {
      continue;
    }
    const bucket = byConnection.get(connection.id);
    if (bucket) bucket.messages.push(row);
    else byConnection.set(connection.id, { connection, messages: [row] });
  }

  for (const bucket of byConnection.values()) {
    try {
      const bodies = await withImapMailboxLock(bucket.connection.id, () =>
        fetchBodies(bucket.connection, bucket.messages)
      );
      for (const [id, body] of bodies) loaded.set(id, body);
    } catch (error) {
      console.error(
        '[imap] could not load an oversized message body',
        error instanceof Error ? error.message : error
      );
    }
  }

  return loaded;
}

async function fetchBodies(
  connection: ConnectionRow,
  messages: Array<{
    id: string;
    imapUid: number | null;
    imapFolderPath: string | null;
  }>
): Promise<Map<string, LoadedMailBody>> {
  const loaded = new Map<string, LoadedMailBody>();
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
    return loaded;
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
    const byFolder = new Map<string, typeof messages>();
    for (const message of messages) {
      if (!message.imapFolderPath || message.imapUid == null) continue;
      const list = byFolder.get(message.imapFolderPath) ?? [];
      list.push(message);
      byFolder.set(message.imapFolderPath, list);
    }

    for (const [folderPath, folderMessages] of byFolder) {
      if (!isImapMailboxPath(folderPath)) continue;
      await client.mailboxOpen(folderPath);
      for (const message of folderMessages) {
        if (message.imapUid == null) continue;
        const fetched = await fetchTextSourceForUid(
          client,
          message.imapUid,
          IMAP_ON_DEMAND_TEXT_BYTES
        );
        if (!fetched || fetched.bodyOmitted) continue;
        const mail = await simpleParser(fetched.source);
        const rawHtml =
          typeof mail.html === 'string' && mail.html.trim() ? mail.html : null;
        const bodies = resolveStoredMailBodies({
          html: rawHtml,
          text: mail.text ?? null
        });
        if (bodies.bodyText === IMAP_BODY_TOO_LARGE_TEXT && !bodies.bodyHtml) {
          continue;
        }
        await prisma.mailMessage.update({
          where: { id: message.id },
          data: {
            bodyText: bodies.bodyText,
            bodyHtml: bodies.bodyHtml,
            bodyOmitted: false
          }
        });
        loaded.set(message.id, bodies);
      }
    }
    await client.logout();
    return loaded;
  } catch (error) {
    try {
      await client.close();
    } catch {
      // ignore cleanup errors
    }
    const message =
      error instanceof Error ? error.message : 'Could not load the message';
    if (isImapAuthError(error)) {
      await markMailboxNeedsReauth(connection.id, message);
    }
    throw error;
  }
}
