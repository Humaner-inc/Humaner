-- Rename CharacterType value 'sharp' to 'efficient' and add 'custom'.
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

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "customCharacterPrompt" TEXT;
