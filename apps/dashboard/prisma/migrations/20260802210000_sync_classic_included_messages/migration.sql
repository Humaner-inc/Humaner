-- Align Classic message allowances with the current volume steps (200 / 500 / 1000).
-- Orphan values from the previous 250-message Classic SKU snap to the entry bundle.

UPDATE "User"
SET "includedMessages" = 200
WHERE "tier" = 'classic'
  AND "includedMessages" NOT IN (200, 500, 1000);

UPDATE "Organization"
SET "includedMessages" = 200
WHERE "tier" = 'classic'
  AND "includedMessages" NOT IN (200, 500, 1000);

-- Align Frontier allowances with current volume steps (2000 / 3000 / 5000).
UPDATE "User"
SET "includedMessages" = 3000
WHERE "tier" = 'frontier'
  AND "includedMessages" NOT IN (2000, 3000, 5000);

UPDATE "Organization"
SET "includedMessages" = 3000
WHERE "tier" = 'frontier'
  AND "includedMessages" NOT IN (2000, 3000, 5000);
