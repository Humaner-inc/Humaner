-- Workspace toggle: automatically draft reply suggestions on unread inbound mail.
ALTER TABLE "Organization"
ADD COLUMN IF NOT EXISTS "inboxAutoSuggestReplies" BOOLEAN NOT NULL DEFAULT true;
