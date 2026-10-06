-- Optional extras on outbound templates (links + attachment payloads).
ALTER TABLE "OutboundTemplate" ADD COLUMN IF NOT EXISTS "extras" JSONB;

-- Contact groups (user-scoped address-book lists).
CREATE TABLE IF NOT EXISTS "ContactGroup" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PK_ContactGroup" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ContactGroupMember" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_ContactGroupMember" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IX_ContactGroup_userId" ON "ContactGroup"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_ContactGroup_user_name" ON "ContactGroup"("userId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_ContactGroupMember_group_contact" ON "ContactGroupMember"("groupId", "contactId");
CREATE INDEX IF NOT EXISTS "IX_ContactGroupMember_contactId" ON "ContactGroupMember"("contactId");

ALTER TABLE "ContactGroup" DROP CONSTRAINT IF EXISTS "ContactGroup_userId_fkey";
ALTER TABLE "ContactGroup" ADD CONSTRAINT "ContactGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactGroupMember" DROP CONSTRAINT IF EXISTS "ContactGroupMember_groupId_fkey";
ALTER TABLE "ContactGroupMember" ADD CONSTRAINT "ContactGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ContactGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactGroupMember" DROP CONSTRAINT IF EXISTS "ContactGroupMember_contactId_fkey";
ALTER TABLE "ContactGroupMember" ADD CONSTRAINT "ContactGroupMember_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
