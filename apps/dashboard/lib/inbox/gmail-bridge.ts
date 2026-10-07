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

export async function createGmailDraft(): Promise<never> {
  throw new Error(GMAIL_UNAVAILABLE);
}

export async function updateGmailDraft(): Promise<never> {
  throw new Error(GMAIL_UNAVAILABLE);
}

export async function sendGmailDraft(): Promise<never> {
  throw new Error(GMAIL_UNAVAILABLE);
}

export async function sendGmailMessage(): Promise<never> {
  throw new Error(GMAIL_UNAVAILABLE);
}

export async function findGmailDraftIdByMessageId(): Promise<null> {
  return null;
}

export async function modifyGmailThread(): Promise<void> {
  throw new Error(GMAIL_UNAVAILABLE);
}

export async function deleteGmailThread(): Promise<void> {
  throw new Error(GMAIL_UNAVAILABLE);
}
