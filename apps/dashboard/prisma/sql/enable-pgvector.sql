-- Deprecated: use prisma/sql/phase3-gap-clustering.sql
-- Kept for reference — enable vector in Supabase Dashboard first.

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);
