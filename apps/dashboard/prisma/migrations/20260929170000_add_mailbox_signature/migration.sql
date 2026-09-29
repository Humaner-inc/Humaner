-- Per-mailbox email signature (text and/or icon).
ALTER TABLE "MailboxConnection"
  ADD COLUMN IF NOT EXISTS "signatureText" TEXT,
  ADD COLUMN IF NOT EXISTS "signatureIconData" BYTEA,
  ADD COLUMN IF NOT EXISTS "signatureIconContentType" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "signatureIconHash" VARCHAR(64);
