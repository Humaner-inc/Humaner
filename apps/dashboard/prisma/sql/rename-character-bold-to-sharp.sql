-- db:push cannot rename enum labels; it drops "bold" and adds "sharp", which
-- fails when Agent rows still store "bold". Run this before db:push (or use
-- db:migrate, which applies the matching migration automatically).
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
