-- Phase 3: run before `pnpm db:push` (or via Neon SQL editor on DIRECT connection).
-- Step 1 (required once): Neon Console → Extensions → enable "vector".
-- Step 2: run this file — uses DIRECT_URL if set, else DATABASE_URL.

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

-- Uses cosine distance (vector_cosine_ops) to match OpenAI embeddings.
-- No CONCURRENTLY: prisma db execute runs inside a transaction.
CREATE INDEX IF NOT EXISTS "IX_Message_embedding_hnsw"
  ON "Message" USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64)
  WHERE "embedding" IS NOT NULL;

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
