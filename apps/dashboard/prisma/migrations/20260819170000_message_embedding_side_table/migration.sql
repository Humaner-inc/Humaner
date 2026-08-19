-- Move Message.embedding onto MessageEmbedding. Run after vector is enabled.
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS "MessageEmbedding" (
    "messageId" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "contentHash" VARCHAR(64) NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_MessageEmbedding" PRIMARY KEY ("messageId")
);

DO $$
BEGIN
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
              trim(regexp_replace(lower(m.content), '[^[:alnum:][:space:]]+', ' ', 'g')),
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

DO $$
BEGIN
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
