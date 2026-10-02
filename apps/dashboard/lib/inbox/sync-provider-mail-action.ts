import 'server-only';

import {
  MailConnectionStatus,
  MailProvider,
  MailThreadFolder
} from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { modifyGmailThread } from '@/lib/inbox/gmail/api';
import { GMAIL_MODIFY_SCOPE_HINT } from '@/lib/inbox/gmail/oauth';
import { getGmailAccessToken } from '@/lib/inbox/gmail/tokens';

const SYNTHETIC_THREAD_RE = /^(outbound-|draft-)/i;

const GMAIL_MODIFY_SCOPE = 'https://www.googleapis.com/auth/gmail.modify';
const GMAIL_FULL_SCOPE = 'https://mail.google.com/';

export type ProviderMailAction =
  | 'archive'
  | 'unarchive'
  | 'trash'
  | 'spam'
  | 'inbox'
  | 'read'
  | 'unread';

function isProviderThreadId(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && !SYNTHETIC_THREAD_RE.test(trimmed);
}

function connectionHasGmailModifyScope(scopes: string | null): boolean {
  if (!scopes) {
    // Legacy rows may omit scopes; connect flow always requested gmail.modify.
    return true;
  }
  const granted = new Set(scopes.split(/[\s,]+/).filter(Boolean));
  return granted.has(GMAIL_MODIFY_SCOPE) || granted.has(GMAIL_FULL_SCOPE);
}

function gmailLabelPatch(action: ProviderMailAction): {
  addLabelIds: string[];
  removeLabelIds: string[];
} {
  switch (action) {
    case 'archive':
      return { addLabelIds: [], removeLabelIds: ['INBOX'] };
    case 'unarchive':
    case 'inbox':
      return {
        addLabelIds: ['INBOX'],
        removeLabelIds: ['TRASH', 'SPAM']
      };
    case 'trash':
      return {
        addLabelIds: ['TRASH'],
        removeLabelIds: ['INBOX', 'SPAM']
      };
    case 'spam':
      return {
        addLabelIds: ['SPAM'],
        removeLabelIds: ['INBOX', 'TRASH']
      };
    case 'read':
      return { addLabelIds: [], removeLabelIds: ['UNREAD'] };
    case 'unread':
      return { addLabelIds: ['UNREAD'], removeLabelIds: [] };
  }
}

async function applyGmailThreadAction(input: {
  connectionId: string;
  scopes: string | null;
  providerThreadId: string;
  action: ProviderMailAction;
}): Promise<void> {
  if (!connectionHasGmailModifyScope(input.scopes)) {
    await prisma.mailboxConnection.update({
      where: { id: input.connectionId },
      data: {
        status: MailConnectionStatus.NEEDS_REAUTH,
        lastError: GMAIL_MODIFY_SCOPE_HINT
      }
    });
    throw new Error(GMAIL_MODIFY_SCOPE_HINT);
  }

  const accessToken = await getGmailAccessToken(input.connectionId);
  const patch = gmailLabelPatch(input.action);
  await modifyGmailThread(accessToken, input.providerThreadId, patch);
}

/**
 * Mirror a Humaner inbox action onto the connected provider (Gmail today).
 * Synthetic / draft threads are skipped. Missing remote threads are ignored.
 */
export async function syncProviderMailAction(input: {
  threadId: string;
  organizationId: string;
  action: ProviderMailAction;
}): Promise<void> {
  const thread = await prisma.mailThread.findFirst({
    where: { id: input.threadId, organizationId: input.organizationId },
    select: {
      providerThreadId: true,
      alias: {
        select: {
          connection: {
            select: {
              id: true,
              provider: true,
              scopes: true
            }
          }
        }
      }
    }
  });

  if (!thread || !isProviderThreadId(thread.providerThreadId)) {
    return;
  }

  const connection = thread.alias.connection;
  if (connection.provider !== MailProvider.GMAIL) {
    return;
  }

  try {
    await applyGmailThreadAction({
      connectionId: connection.id,
      scopes: connection.scopes,
      providerThreadId: thread.providerThreadId,
      action: input.action
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Gmail sync failed';
    if (/notFound|404/i.test(message)) {
      return;
    }
    throw error;
  }
}

export function providerActionForFolder(
  folder: MailThreadFolder
): ProviderMailAction | null {
  switch (folder) {
    case MailThreadFolder.INBOX:
      return 'inbox';
    case MailThreadFolder.TRASH:
      return 'trash';
    case MailThreadFolder.SPAM:
      return 'spam';
    default:
      return null;
  }
}

export async function syncProviderMailActions(input: {
  threadIds: string[];
  organizationId: string;
  action: ProviderMailAction;
}): Promise<void> {
  for (const threadId of input.threadIds) {
    await syncProviderMailAction({
      threadId,
      organizationId: input.organizationId,
      action: input.action
    });
  }
}
