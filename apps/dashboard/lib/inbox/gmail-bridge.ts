import 'server-only';

/**
 * Self-Host has no Gmail OAuth. IMAP send, sync, and folder actions never call
 * these; a Gmail provider row fails closed instead of reaching Google.
 */

const GMAIL_UNAVAILABLE = 'Gmail is not available on Self-Host. Connect IMAP.';

export const GMAIL_MODIFY_SCOPE_HINT = GMAIL_UNAVAILABLE;
export const GMAIL_FULL_MAIL_SCOPE_HINT = GMAIL_UNAVAILABLE;

export function hasGmailModifyScope(
  _scopes: string | null | undefined
): boolean {
  return false;
}

export function hasGmailFullMailScope(
  _scopes: string | null | undefined
): boolean {
  return false;
}

export function isGmailQuotaError(_error: unknown): boolean {
  return false;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function getGmailAccessToken(
  _connectionId: string
): Promise<string> {
  throw new Error(GMAIL_UNAVAILABLE);
}

export async function stopGmailWatch(_connectionId: string): Promise<void> {
  // No Gmail watch to stop on Self-Host.
}

export async function syncGmailMailboxes(_input: {
  organizationId: string;
  connectionId?: string;
  respectMinInterval?: boolean;
  inboxOnly?: boolean;
  priority?: 'user' | 'cron';
}): Promise<{ connections: number; messages: number; errors: number }> {
  return { connections: 0, messages: 0, errors: 0 };
}

export type GmailOutgoingMessage = {
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    name: string;
    mediaType: string;
    data: string;
    cid?: string;
  }>;
  inReplyTo?: string;
  references?: string;
};

export type GmailDraftResult = {
  draftId: string;
  messageId: string;
  threadId: string;
};

export async function createGmailDraft(
  _accessToken: string,
  _message: GmailOutgoingMessage
): Promise<GmailDraftResult> {
  throw new Error(GMAIL_UNAVAILABLE);
}

export async function updateGmailDraft(
  _accessToken: string,
  _draftId: string,
  _message: GmailOutgoingMessage
): Promise<GmailDraftResult> {
  throw new Error(GMAIL_UNAVAILABLE);
}

export async function sendGmailDraft(
  _accessToken: string,
  _draftId: string
): Promise<{ id: string; threadId: string }> {
  throw new Error(GMAIL_UNAVAILABLE);
}

export async function sendGmailMessage(
  _accessToken: string,
  _message: GmailOutgoingMessage,
  _threadId?: string
): Promise<{ id: string; threadId: string }> {
  throw new Error(GMAIL_UNAVAILABLE);
}

export async function findGmailDraftIdByMessageId(
  _accessToken: string,
  _messageId: string
): Promise<string | null> {
  return null;
}

export async function modifyGmailThread(
  _accessToken: string,
  _threadId: string,
  _input: { addLabelIds?: string[]; removeLabelIds?: string[] }
): Promise<void> {
  throw new Error(GMAIL_UNAVAILABLE);
}

export async function deleteGmailThread(
  _accessToken: string,
  _threadId: string
): Promise<void> {
  throw new Error(GMAIL_UNAVAILABLE);
}
