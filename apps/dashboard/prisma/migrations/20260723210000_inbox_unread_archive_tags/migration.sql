-- AlterTable
ALTER TABLE "MailboxConnection" ADD COLUMN "providerPresetId" VARCHAR(64);

-- AlterTable
ALTER TABLE "MailThread" ADD COLUMN "isUnread" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "MailThread" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- Existing synced threads were already seen in the product — mark them read.
UPDATE "MailThread" SET "isUnread" = false;

-- CreateTable
CREATE TABLE "MailTag" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "color" VARCHAR(7) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_MailTag" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailThreadTag" (
    "id" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "tagId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_MailThreadTag" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IX_MailThread_org_unread_archived" ON "MailThread"("organizationId", "isUnread", "archivedAt");

-- CreateIndex
CREATE INDEX "IX_MailTag_organizationId" ON "MailTag"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_MailTag_org_name" ON "MailTag"("organizationId", "name");

-- CreateIndex
CREATE INDEX "IX_MailThreadTag_tagId" ON "MailThreadTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_MailThreadTag_thread_tag" ON "MailThreadTag"("threadId", "tagId");

-- AddForeignKey
ALTER TABLE "MailTag" ADD CONSTRAINT "MailTag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailThreadTag" ADD CONSTRAINT "MailThreadTag_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MailThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailThreadTag" ADD CONSTRAINT "MailThreadTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "MailTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
