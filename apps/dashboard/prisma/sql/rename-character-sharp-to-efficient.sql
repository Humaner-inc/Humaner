-- db:push cannot rename enum labels; it drops "sharp" and adds "efficient", which
-- fails when Agent rows still store "sharp". Run this before db:push (or use
-- db:migrate, which applies the matching migration automatically).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'CharacterType'
      AND e.enumlabel = 'sharp'
  ) THEN
    ALTER TYPE "CharacterType" RENAME VALUE 'sharp' TO 'efficient';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'CharacterType'
      AND e.enumlabel = 'custom'
  ) THEN
    ALTER TYPE "CharacterType" ADD VALUE 'custom';
  END IF;
END $$;
