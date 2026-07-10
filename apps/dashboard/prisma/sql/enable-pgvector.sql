-- Phase 3 prerequisite: enable pgvector in Supabase Dashboard first
-- (Database → Extensions → vector), then run:
--   pnpm --filter @humaner/dashboard db:execute:pgvector
--   pnpm db:migrate
--
-- Or run this file manually in the Supabase SQL editor (not via pooler):
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);
