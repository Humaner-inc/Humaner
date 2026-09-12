-- Workspace Companion mail rights (DRAFT, ASSIGN, SEND). Empty inherits alias policies.
ALTER TABLE "Organization"
ADD COLUMN IF NOT EXISTS "companionActions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
