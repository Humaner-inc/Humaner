/**
 * User-facing Gmail error copy (safe for client + server).
 * Keep phrasing short — never surface Google API JSON to the UI.
 */

/** Shared by sync, send, and folder actions — same Gmail per-user unit budget. */
export const GMAIL_QUOTA_USER_MESSAGE =
  'Gmail rate limit reached. Wait about a minute, then try again.';

export function isGmailQuotaErrorMessage(message: string): boolean {
  return /quota exceeded|rateLimitExceeded|rate limit|User-rate limit|Units per minute|Total Query Cost|RESOURCE_EXHAUSTED|Gmail sync limit has been reached|Gmail rate limit reached/i.test(
    message
  );
}

/** Google API error bodies often look like `{ "error": { "code": 403, ... } }`. */
export function isGoogleApiErrorJson(message: string): boolean {
  const trimmed = message.trim();
  return (
    /"error"\s*:\s*\{/.test(trimmed) ||
    /gmail\.googleapis\.com/i.test(trimmed) ||
    (/^\s*\{/.test(trimmed) && /"code"\s*:\s*\d{3}/.test(trimmed))
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
  if (isGoogleApiErrorJson(message)) {
    return 'Gmail could not complete that request. Try again in a moment.';
  }
  return message.trim();
}

/**
 * Action/send boundary: never append raw Google JSON to "Could not send…".
 */
export function humanizeMailboxActionError(
  error: unknown,
  fallback: string
): string {
  const raw =
    error instanceof Error && error.message.trim() ? error.message.trim() : '';
  if (!raw) return fallback;
  if (isGmailQuotaErrorMessage(raw)) {
    return GMAIL_QUOTA_USER_MESSAGE;
  }
  if (isGoogleApiErrorJson(raw)) {
    return isGmailQuotaErrorMessage(raw)
      ? GMAIL_QUOTA_USER_MESSAGE
      : 'Gmail could not complete that request. Try again in a moment.';
  }
  return humanizeMailboxSyncError(raw) ?? fallback;
}
