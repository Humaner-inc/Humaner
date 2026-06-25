-- Agent Training & Intelligence System
-- Adds platform-level knowledge, evaluation runs, and knowledge gaps

-- Add training fields to Agent
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "healthScore" DOUBLE PRECISION;
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "lastTrainedAt" TIMESTAMP(3);
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "autoTrainEnabled" BOOLEAN NOT NULL DEFAULT true;

-- Platform-level knowledge chunks (shared across vertical)
CREATE TABLE IF NOT EXISTS "PlatformChunk" (
    "id" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'synthetic',
    "qualityScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_PlatformChunk" PRIMARY KEY ("id")
);

-- Agent evaluation runs (platform or per-agent)
CREATE TABLE IF NOT EXISTS "AgentEvalRun" (
    "id" UUID NOT NULL,
    "agentId" UUID,
    "industry" TEXT,
    "totalQuestions" INTEGER NOT NULL,
    "passed" INTEGER NOT NULL,
    "accuracyAvg" DOUBLE PRECISION NOT NULL,
    "personaAvg" DOUBLE PRECISION NOT NULL,
    "helpfulnessAvg" DOUBLE PRECISION NOT NULL,
    "hallucinationCount" INTEGER NOT NULL,
    "runType" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_AgentEvalRun" PRIMARY KEY ("id")
);

-- Individual evaluation results
CREATE TABLE IF NOT EXISTS "EvalResult" (
    "id" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "questionType" TEXT,
    "response" TEXT NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "persona" DOUBLE PRECISION NOT NULL,
    "helpfulness" DOUBLE PRECISION NOT NULL,
    "hallucination" DOUBLE PRECISION NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_EvalResult" PRIMARY KEY ("id")
);

-- Knowledge gaps surfaced from evaluations
CREATE TABLE IF NOT EXISTS "KnowledgeGap" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "evalRunId" UUID,
    "suggestedAnswer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_KnowledgeGap" PRIMARY KEY ("id")
);

-- Platform gap candidates from production conversations
CREATE TABLE IF NOT EXISTS "PlatformGapCandidate" (
    "id" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_PlatformGapCandidate" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "IX_PlatformChunk_industry" ON "PlatformChunk"("industry");
CREATE INDEX IF NOT EXISTS "IX_AgentEvalRun_agentId" ON "AgentEvalRun"("agentId");
CREATE INDEX IF NOT EXISTS "IX_AgentEvalRun_industry" ON "AgentEvalRun"("industry");
CREATE INDEX IF NOT EXISTS "IX_EvalResult_runId" ON "EvalResult"("runId");
CREATE INDEX IF NOT EXISTS "IX_KnowledgeGap_agentId" ON "KnowledgeGap"("agentId");
CREATE INDEX IF NOT EXISTS "IX_KnowledgeGap_status" ON "KnowledgeGap"("status");
CREATE INDEX IF NOT EXISTS "IX_PlatformGapCandidate_industry" ON "PlatformGapCandidate"("industry");
CREATE INDEX IF NOT EXISTS "IX_PlatformGapCandidate_status" ON "PlatformGapCandidate"("status");

-- Foreign keys
ALTER TABLE "AgentEvalRun" ADD CONSTRAINT "AgentEvalRun_agentId_fkey" 
    FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EvalResult" ADD CONSTRAINT "EvalResult_runId_fkey" 
    FOREIGN KEY ("runId") REFERENCES "AgentEvalRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KnowledgeGap" ADD CONSTRAINT "KnowledgeGap_agentId_fkey" 
    FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
