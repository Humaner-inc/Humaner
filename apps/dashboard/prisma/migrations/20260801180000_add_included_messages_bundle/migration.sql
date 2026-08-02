-- Persist selected message-bundle allowance alongside tier.
-- Account (User) is source of truth; Organization mirrors it.

ALTER TABLE "User" ADD COLUMN "includedMessages" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Organization" ADD COLUMN "includedMessages" INTEGER NOT NULL DEFAULT 50;

-- Backfill from current tier defaults (legacy single-SKU products).
UPDATE "User"
SET "includedMessages" = CASE "tier"
  WHEN 'classic' THEN 200
  WHEN 'refined' THEN 1000
  WHEN 'frontier' THEN 3000
  WHEN 'humaner' THEN 20000
  ELSE 50
END;

UPDATE "Organization"
SET "includedMessages" = CASE "tier"
  WHEN 'classic' THEN 200
  WHEN 'refined' THEN 1000
  WHEN 'frontier' THEN 3000
  WHEN 'humaner' THEN 20000
  ELSE 50
END;
