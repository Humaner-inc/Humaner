-- Backfill for the account-level billing migration. Run this AFTER
-- `prisma db push` has added User.tier, User.polarCustomerId, and
-- Organization.ownerId to the database, since this only backfills data —
-- it does not create any columns/indexes itself.

-- Resolve each workspace's owner from its OWNER membership (earliest wins
-- if a workspace somehow has more than one OWNER membership).
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
WHERE ro."organizationId" = o."id" AND ro.rn = 1 AND o."ownerId" IS NULL;

-- Resolve each account's plan from the highest-tier workspace it already
-- owns, so no existing paid plan is lost by the switch to account-level
-- billing.
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
-- this is the step that actually fixes mismatched tiers across workspaces
-- for the same account.
UPDATE "Organization" o
SET "tier" = u."tier",
    "polarCustomerId" = u."polarCustomerId"
FROM "User" u
WHERE o."ownerId" = u."id";
