-- Deprecated: use prisma/sql/phase3-gap-clustering.sql
-- Kept for reference — enable vector in Neon Console first.
-- Do not ADD Message.embedding here; vectors live on MessageEmbedding.

CREATE EXTENSION IF NOT EXISTS vector;
