-- AlterTable
ALTER TABLE "MailTag" ADD COLUMN "aliasId" UUID;

-- DropIndex
DROP INDEX "UQ_MailTag_org_name";

-- CreateIndex
CREATE INDEX "IX_MailTag_organizationId_aliasId" ON "MailTag"("organizationId", "aliasId");

-- Org-wide tags (aliasId IS NULL): unique name per org
CREATE UNIQUE INDEX "UQ_MailTag_org_name_all" ON "MailTag"("organizationId", "name") WHERE "aliasId" IS NULL;

-- Per-alias tags: unique name per org + alias
CREATE UNIQUE INDEX "UQ_MailTag_org_alias_name" ON "MailTag"("organizationId", "aliasId", "name") WHERE "aliasId" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "MailTag" ADD CONSTRAINT "MailTag_aliasId_fkey" FOREIGN KEY ("aliasId") REFERENCES "MailAlias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
