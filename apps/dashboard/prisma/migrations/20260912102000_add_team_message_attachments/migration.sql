-- Persist file and image attachments on workspace team messages.
ALTER TABLE "TeamMessage"
ADD COLUMN IF NOT EXISTS "attachments" JSONB NOT NULL DEFAULT '[]';
