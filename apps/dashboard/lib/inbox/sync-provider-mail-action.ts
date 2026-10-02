import 'server-only';

import {
  MailConnectionStatus,
  MailProvider,
  MailThreadFolder
} from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { modifyGmailThread } from '@/lib/inbox/gmail/api';
import {
  GMAIL_MODIFY_SCOPE_HINT,
  hasGmailModifyScope
} from '@/lib/inbox/gmail/oauth';
import { getGmailAccessToken } from '@/lib/inbox/gmail/tokens';
import { applyImapMailActionForThread } from '@/lib/inbox/imap-mail-actions';

const SYNTHETIC_THREAD_RE = /^(outbound-|draft-)/i;

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

/**
 * Legacy rows may omit scopes (connect always requested modify). Explicit
 * scopes without modify must fail closed.
 */
function connectionAllowsGmailModify(scopes: string | null): boolean {
  if (!scopes?.trim()) return true;
  return hasGmailModifyScope(scopes);
}

function isInsufficientScopeError(message: string): boolean {
  return /insufficient.*(auth|scope)|ACCESS_TOKEN_SCOPE_INSUFFICIENT|Request had insufficient authentication scopes/i.test(
    message
  );
}

function gmailLabelPatch(action: ProviderMailAction): {
  addLabelIds: string[];
  removeLabelIds: string[];
} {
  switch (action) {
    case 'archive':
      // Gmail archive = leave All Mail / Sent, drop Inbox.
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

async function markGmailNeedsModifyScope(connectionId: string): Promise<void> {
  await prisma.mailboxConnection.update({
    where: { id: connectionId },
    data: {
      status: MailConnectionStatus.NEEDS_REAUTH,
      lastError: GMAIL_MODIFY_SCOPE_HINT
    }
  });
}

async function applyGmailThreadAction(input: {
  connectionId: string;
  scopes: string | null;
  providerThreadId: string;
  action: ProviderMailAction;
}): Promise<void> {
  if (!connectionAllowsGmailModify(input.scopes)) {
    await markGmailNeedsModifyScope(input.connectionId);
    throw new Error(GMAIL_MODIFY_SCOPE_HINT);
  }

  const accessToken = await getGmailAccessToken(input.connectionId);
  const patch = gmailLabelPatch(input.action);

  try {
    await modifyGmailThread(accessToken, input.providerThreadId, patch);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Gmail sync failed';
    if (isInsufficientScopeError(message)) {
      await markGmailNeedsModifyScope(input.connectionId);
      throw new Error(GMAIL_MODIFY_SCOPE_HINT);
    }
    throw error;
  }
}

/**
 * Mirror a Humaner inbox action onto the connected provider (Gmail + IMAP).
 * Synthetic / draft threads are skipped. Missing remote Gmail threads are ignored.
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

  if (!thread) {
    return;
  }

  const connection = thread.alias.connection;

  if (connection.provider === MailProvider.GMAIL) {
    if (!isProviderThreadId(thread.providerThreadId)) {
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
    return;
  }

  if (connection.provider === MailProvider.IMAP) {
    await applyImapMailActionForThread({
      threadId: input.threadId,
      organizationId: input.organizationId,
      action: input.action
    });
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
