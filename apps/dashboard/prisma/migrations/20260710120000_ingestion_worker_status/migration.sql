-- Ingestion worker lifecycle + versioning fields
ALTER TYPE "SyncStatus" ADD VALUE IF NOT EXISTS 'queued';
ALTER TYPE "SyncStatus" ADD VALUE IF NOT EXISTS 'extracting';
ALTER TYPE "SyncStatus" ADD VALUE IF NOT EXISTS 'indexing';

ALTER TABLE "KnowledgeSource" ADD COLUMN IF NOT EXISTS "chunkerVersion" VARCHAR(32);
ALTER TABLE "KnowledgeSource" ADD COLUMN IF NOT EXISTS "embeddingModel" VARCHAR(64);
ALTER TABLE "KnowledgeSource" ADD COLUMN IF NOT EXISTS "storagePath" VARCHAR(2048);
