-- RenameColumn
ALTER TABLE "ContactActivity" RENAME COLUMN "occuredAt" TO "occurredAt";

-- RenameIndex
ALTER INDEX "IX_ContactActivity_occuredAt" RENAME TO "IX_ContactActivity_occurredAt";

-- RenameIndex
ALTER INDEX "IX_ContactImage_userId" RENAME TO "IX_ContactImage_contactId";

-- RenameIndex
ALTER INDEX "IX_User_organzationId" RENAME TO "IX_User_organizationId";
