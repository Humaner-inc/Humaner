-- Message.embedding as pgvector (Phase 3 cluster:gaps)
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);
