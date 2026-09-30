-- Signature icon display height for outbound HTML mail.
ALTER TABLE "MailboxConnection"
  ADD COLUMN IF NOT EXISTS "signatureIconHeight" INTEGER NOT NULL DEFAULT 48;
