-- CreateEnum
CREATE TYPE "MailThreadFolder" AS ENUM ('inbox', 'sent', 'spam', 'trash');

-- AlterTable
ALTER TABLE "MailThread" ADD COLUMN "folder" "MailThreadFolder" NOT NULL DEFAULT 'inbox';

-- Composed / outbound-only threads belong in Sent, not Inbox.
UPDATE "MailThread" AS t
SET "folder" = 'sent'
WHERE NOT EXISTS (
    SELECT 1
    FROM "MailMessage" AS m
    WHERE m."threadId" = t."id" AND m."direction" = 'inbound'
  )
  AND EXISTS (
    SELECT 1
    FROM "MailMessage" AS m
    WHERE m."threadId" = t."id" AND m."direction" = 'outbound'
  );

-- CreateIndex
CREATE INDEX "IX_MailThread_org_folder_archived" ON "MailThread"("organizationId", "folder", "archivedAt");

-- CreateTable
CREATE TABLE "MailBlockedSender" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_MailBlockedSender" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_MailBlockedSender_org_email" ON "MailBlockedSender"("organizationId", "email");

-- CreateIndex
CREATE INDEX "IX_MailBlockedSender_organizationId" ON "MailBlockedSender"("organizationId");

-- AddForeignKey
ALTER TABLE "MailBlockedSender" ADD CONSTRAINT "MailBlockedSender_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
