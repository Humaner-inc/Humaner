-- Incremental mailbox sync: skip unchanged Gmail threads + IMAP UID cursors.
ALTER TABLE "MailboxConnection" ADD COLUMN IF NOT EXISTS "syncCursor" JSONB;

ALTER TABLE "MailThread" ADD COLUMN IF NOT EXISTS "providerHistoryId" VARCHAR(64);
