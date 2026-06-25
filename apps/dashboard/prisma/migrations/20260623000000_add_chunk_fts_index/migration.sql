-- Full-text search index for keyword-based knowledge retrieval (widget RAG).
-- Uses an explicit 'english' regconfig so the expression is IMMUTABLE and indexable.
CREATE INDEX IF NOT EXISTS "IX_Chunk_content_fts"
  ON "Chunk"
  USING gin (to_tsvector('english', "content"));
