-- Phase 3: idempotent. `pnpm db:push` runs this before the push (vector
-- extension + MessageEmbedding backfill/drop of Message.embedding) and after
-- (indexes on a table the push just created). Also runnable via Neon SQL editor.
-- Step 1 (required once): Neon Console → Extensions → enable "vector".

CREATE EXTENSION IF NOT EXISTS vector;

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

CREATE TABLE IF NOT EXISTS "MessageEmbedding" (
    "messageId" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "contentHash" VARCHAR(64) NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_MessageEmbedding" PRIMARY KEY ("messageId")
);

-- Move vectors off the hot Message table. Hash is best-effort compatible with
-- `hashMessageContent` in message-embedding-match.ts (punctuation stripped).
DO $$
BEGIN
  IF to_regclass('"Message"') IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = '"Message"'::regclass
      AND attname = 'embedding'
      AND NOT attisdropped
  ) THEN
    INSERT INTO "MessageEmbedding" ("messageId", "agentId", "contentHash", "embedding", "createdAt")
    SELECT
      m.id,
      c."agentId",
      encode(
        sha256(
          convert_to(
            left(
              trim(
                regexp_replace(
                  regexp_replace(lower(m.content), '[^[:alnum:][:space:]]+', ' ', 'g'),
                  '\s+',
                  ' ',
                  'g'
                )
              ),
              512
            ),
            'UTF8'
          )
        ),
        'hex'
      ),
      m.embedding,
      m."createdAt"
    FROM "Message" m
    INNER JOIN "Conversation" c ON c.id = m."conversationId"
    WHERE m.embedding IS NOT NULL
    ON CONFLICT ("messageId") DO NOTHING;

    DROP INDEX IF EXISTS "IX_Message_embedding_hnsw";
    DROP INDEX IF EXISTS "IX_Message_embedding_createdAt";
    ALTER TABLE "Message" DROP COLUMN IF EXISTS "embedding";
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IX_MessageEmbedding_agent_hash_createdAt"
  ON "MessageEmbedding" ("agentId", "contentHash", "createdAt");

CREATE INDEX IF NOT EXISTS "IX_MessageEmbedding_agent_createdAt"
  ON "MessageEmbedding" ("agentId", "createdAt");

CREATE INDEX IF NOT EXISTS "IX_MessageEmbedding_createdAt"
  ON "MessageEmbedding" ("createdAt");

-- Keep hashes aligned with hashMessageContent() (collapse punctuation AND whitespace).
DO $$
BEGIN
  IF to_regclass('"Message"') IS NULL OR to_regclass('"MessageEmbedding"') IS NULL THEN
    RETURN;
  END IF;

  UPDATE "MessageEmbedding" AS e
  SET "contentHash" = encode(
    sha256(
      convert_to(
        left(
          trim(
            regexp_replace(
              regexp_replace(lower(m.content), '[^[:alnum:][:space:]]+', ' ', 'g'),
              '\s+',
              ' ',
              'g'
            )
          ),
          512
        ),
        'UTF8'
      )
    ),
    'hex'
  )
  FROM "Message" m
  WHERE m.id = e."messageId";
END $$;

DO $$
BEGIN
  IF to_regclass('"Agent"') IS NULL OR to_regclass('"Message"') IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MessageEmbedding_messageId_fkey'
  ) THEN
    ALTER TABLE "MessageEmbedding"
      ADD CONSTRAINT "MessageEmbedding_messageId_fkey"
      FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MessageEmbedding_agentId_fkey'
  ) THEN
    ALTER TABLE "MessageEmbedding"
      ADD CONSTRAINT "MessageEmbedding_agentId_fkey"
      FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

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
