-- Retire the Refined plan tier (no active subscribers).
-- Remap any leftover User / Organization rows onto Classic.

UPDATE "User"
SET "tier" = 'classic'
WHERE "tier" IN ('refined', 'grow');

UPDATE "Organization"
SET "tier" = 'classic'
WHERE "tier" IN ('refined', 'grow');
