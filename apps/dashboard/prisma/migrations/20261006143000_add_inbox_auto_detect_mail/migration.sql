-- Workspace toggle: auto-detect new inbox mail and show toasts.
ALTER TABLE "Organization"
ADD COLUMN IF NOT EXISTS "inboxAutoDetectMail" BOOLEAN NOT NULL DEFAULT true;
