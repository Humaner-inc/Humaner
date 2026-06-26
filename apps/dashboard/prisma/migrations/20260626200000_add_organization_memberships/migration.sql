-- CreateTable
CREATE TABLE "OrganizationMembership" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "workspaceRole" "WorkspaceRole" NOT NULL DEFAULT 'owner',
    "allowedPages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_OrganizationMembership" PRIMARY KEY ("id")
);

-- Backfill from existing user ↔ organization links
INSERT INTO "OrganizationMembership" ("id", "userId", "organizationId", "workspaceRole", "allowedPages", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    "id",
    "organizationId",
    "workspaceRole",
    "allowedPages",
    NOW(),
    NOW()
FROM "User"
WHERE "organizationId" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UQ_OrganizationMembership_user_org" ON "OrganizationMembership"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "IX_OrganizationMembership_userId" ON "OrganizationMembership"("userId");

-- CreateIndex
CREATE INDEX "IX_OrganizationMembership_organizationId" ON "OrganizationMembership"("organizationId");

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
