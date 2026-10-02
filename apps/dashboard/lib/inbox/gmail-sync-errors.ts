/**
 * User-facing Gmail sync error copy (safe for client + server).
 * Keep phrasing short — never surface Google API JSON to the UI.
 */

export const GMAIL_QUOTA_USER_MESSAGE =
  'Gmail sync limit has been reached, please wait few minutes before retrying.';

export function isGmailQuotaErrorMessage(message: string): boolean {
  return /quota exceeded|rateLimitExceeded|rate limit|User-rate limit|Units per minute|Total Query Cost|RESOURCE_EXHAUSTED|Gmail sync limit has been reached|Gmail rate limit reached/i.test(
    message
  );
}

/** True only for real Gmail thread/message not-found — never bare "404" substrings. */
export function isGmailNotFoundErrorMessage(message: string): boolean {
  return (
    /"reason"\s*:\s*"notFound"/i.test(message) ||
    /"status"\s*:\s*"NOT_FOUND"/i.test(message) ||
    /"code"\s*:\s*404\b/.test(message) ||
    /\bRequested entity was not found\b/i.test(message)
  );
}

export function isInsufficientScopeErrorMessage(message: string): boolean {
  return /insufficient.*(auth|scope|permission)|ACCESS_TOKEN_SCOPE_INSUFFICIENT|Request had insufficient authentication scopes/i.test(
    message
  );
}

/** Map any stored Gmail/provider error to what humans should see. */
export function humanizeMailboxSyncError(
  message: string | null | undefined
): string | null {
  if (!message?.trim()) return null;
  if (isGmailQuotaErrorMessage(message)) {
    return GMAIL_QUOTA_USER_MESSAGE;
  }
  if (isInsufficientScopeErrorMessage(message)) {
    return 'Gmail needs full mail access to delete messages. Reconnect the mailbox.';
  }
  return message.trim();
}
