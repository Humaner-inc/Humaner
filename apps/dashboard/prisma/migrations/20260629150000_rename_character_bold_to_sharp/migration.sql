-- Rename CharacterType value 'bold' to 'sharp'. RENAME VALUE updates the label
-- in place, so existing rows referencing it are migrated automatically.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'CharacterType'
      AND e.enumlabel = 'bold'
  ) THEN
    ALTER TYPE "CharacterType" RENAME VALUE 'bold' TO 'sharp';
  END IF;
END $$;
