-- Selected vertical common-topics describing the org (Workspace → Persona sync).
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "verticalTopics" TEXT[] DEFAULT ARRAY[]::TEXT[];
