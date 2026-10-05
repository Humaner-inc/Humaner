-- Legal identity fields used on quotes and invoices.

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "taxId" VARCHAR(64);
