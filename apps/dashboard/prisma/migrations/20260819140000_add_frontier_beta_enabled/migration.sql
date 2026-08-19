-- Classic Frontier Beta opt-in while paid Frontier is Coming Soon.
ALTER TABLE "User" ADD COLUMN "frontierBetaEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Organization" ADD COLUMN "frontierBetaEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Existing Classic (and higher) workspaces keep the beta surface without a prompt.
UPDATE "User"
SET "frontierBetaEnabled" = true
WHERE "tier" IN ('classic', 'frontier', 'humaner');

UPDATE "Organization"
SET "frontierBetaEnabled" = true
WHERE "tier" IN ('classic', 'frontier', 'humaner');
