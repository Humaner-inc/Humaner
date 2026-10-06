-- Contact group color palette.
ALTER TABLE "ContactGroup" ADD COLUMN IF NOT EXISTS "color" VARCHAR(32) NOT NULL DEFAULT 'sky';
