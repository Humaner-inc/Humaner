-- Move billing (plan tier + Polar customer) from the workspace to the
-- account (owner user). Organization.tier / Organization.polarCustomerId
-- become denormalized mirrors of the owning account, kept in sync so every
-- workspace an account manager owns always shows the same plan.

-- AlterTable: account-level billing fields on User
ALTER TABLE "User" ADD COLUMN "tier" VARCHAR(32) NOT NULL DEFAULT 'free';
ALTER TABLE "User" ADD COLUMN "polarCustomerId" VARCHAR(255);

-- AlterTable: workspace -> owning account link
ALTER TABLE "Organization" ADD COLUMN "ownerId" UUID;

-- Backfill: each workspace's owner is the user with the OWNER membership.
-- If a workspace somehow has more than one OWNER membership, the earliest
-- one wins.
WITH ranked_owners AS (
    SELECT
        om."organizationId",
        om."userId",
        ROW_NUMBER() OVER (
            PARTITION BY om."organizationId"
            ORDER BY om."createdAt" ASC
        ) AS rn
    FROM "OrganizationMembership" om
    WHERE om."workspaceRole" = 'owner'
)
UPDATE "Organization" o
SET "ownerId" = ro."userId"
FROM ranked_owners ro
WHERE ro."organizationId" = o."id" AND ro.rn = 1;

-- Backfill: resolve each account's plan from the highest-tier workspace it
-- already owns, so nobody's existing paid plan is lost by the switch to
-- account-level billing.
WITH tier_rank AS (
    SELECT
        o."ownerId",
        o."tier",
        o."polarCustomerId",
        ROW_NUMBER() OVER (
            PARTITION BY o."ownerId"
            ORDER BY
                CASE o."tier"
                    WHEN 'delegate' THEN 4
                    WHEN 'scale' THEN 3
                    WHEN 'grow' THEN 2
                    ELSE 1
                END DESC,
                o."id" ASC
        ) AS rn
    FROM "Organization" o
    WHERE o."ownerId" IS NOT NULL
)
UPDATE "User" u
SET "tier" = tr."tier",
    "polarCustomerId" = tr."polarCustomerId"
FROM tier_rank tr
WHERE tr."ownerId" = u."id" AND tr.rn = 1;

-- Sync the resolved account plan back down to every workspace it owns —
-- this is the step that actually fixes mismatched tiers across workspaces.
UPDATE "Organization" o
SET "tier" = u."tier",
    "polarCustomerId" = u."polarCustomerId"
FROM "User" u
WHERE o."ownerId" = u."id";

-- CreateIndex
CREATE INDEX "IX_Organization_ownerId" ON "Organization"("ownerId");

-- CreateIndex
CREATE INDEX "IX_User_polarCustomerId" ON "User"("polarCustomerId");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
