-- Phase 3: semantic gap clustering (pgvector + KnowledgeGapCluster)
-- Enable "vector" in Neon Console → Extensions before migrate deploy.
-- Prefer `pnpm db:phase3` + `pnpm db:push` locally (uses DIRECT_URL when set).

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

CREATE TABLE IF NOT EXISTS "KnowledgeGapCluster" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "canonicalQuestion" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL,
    "messageIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_KnowledgeGapCluster" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IX_KnowledgeGapCluster_agentId" ON "KnowledgeGapCluster"("agentId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'KnowledgeGapCluster_agentId_fkey'
  ) THEN
    ALTER TABLE "KnowledgeGapCluster"
      ADD CONSTRAINT "KnowledgeGapCluster_agentId_fkey"
      FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
