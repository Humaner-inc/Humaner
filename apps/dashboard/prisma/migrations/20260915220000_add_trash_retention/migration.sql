-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "MailTrashRetention" AS ENUM ('week', 'month', 'three_months');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "Organization"
ADD COLUMN IF NOT EXISTS "trashRetention" "MailTrashRetention" NOT NULL DEFAULT 'three_months';

-- AlterTable
ALTER TABLE "MailThread"
ADD COLUMN IF NOT EXISTS "trashedAt" TIMESTAMP(3);

-- Backfill so existing Trash rows start the auto-empty clock.
UPDATE "MailThread"
SET "trashedAt" = "updatedAt"
WHERE "folder" = 'trash' AND "trashedAt" IS NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "IX_MailThread_org_folder_trashedAt"
ON "MailThread"("organizationId", "folder", "trashedAt");
