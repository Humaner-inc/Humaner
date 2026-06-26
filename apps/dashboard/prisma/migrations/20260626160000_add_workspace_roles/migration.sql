-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('owner', 'teammate');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "workspaceRole" "WorkspaceRole" NOT NULL DEFAULT 'teammate';
ALTER TABLE "User" ADD COLUMN "allowedPages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Invitation" ADD COLUMN "allowedPages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Promote the earliest user in each organization to workspace owner
UPDATE "User" AS u
SET "workspaceRole" = 'owner'
FROM (
  SELECT DISTINCT ON ("organizationId") id
  FROM "User"
  WHERE "organizationId" IS NOT NULL
  ORDER BY "organizationId", "createdAt" ASC
) AS owners
WHERE u.id = owners.id;

-- Existing teammates get full collaborative page access
UPDATE "User"
SET "allowedPages" = ARRAY[
  'overview',
  'agents',
  'knowledge',
  'training',
  'integrations',
  'analytics',
  'human-desk',
  'settings'
]::TEXT[]
WHERE "workspaceRole" = 'teammate';
