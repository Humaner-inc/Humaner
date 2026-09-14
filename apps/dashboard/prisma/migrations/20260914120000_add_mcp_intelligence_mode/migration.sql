-- Intelligence layer location: false = Companion (native), true = MCP agents.
-- When true the in-app Companion is hidden and MCP exposes Hybrid RAG.
ALTER TABLE "Organization"
ADD COLUMN IF NOT EXISTS "mcpIntelligenceEnabled" BOOLEAN NOT NULL DEFAULT false;
