-- Rename internal plan tier keys to match public product names.
-- grow → refined, scale → frontier, delegate → humaner

UPDATE "User"
SET "tier" = CASE "tier"
  WHEN 'grow' THEN 'refined'
  WHEN 'scale' THEN 'frontier'
  WHEN 'delegate' THEN 'humaner'
  ELSE "tier"
END
WHERE "tier" IN ('grow', 'scale', 'delegate');

UPDATE "Organization"
SET "tier" = CASE "tier"
  WHEN 'grow' THEN 'refined'
  WHEN 'scale' THEN 'frontier'
  WHEN 'delegate' THEN 'humaner'
  ELSE "tier"
END
WHERE "tier" IN ('grow', 'scale', 'delegate');
