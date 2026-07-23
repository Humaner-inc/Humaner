-- Separate model-training consent + anonymised platform contribution tables.

ALTER TABLE "Organization"
ADD COLUMN IF NOT EXISTS "modelTrainingConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "modelTrainingConsentAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "modelTrainingConsentById" UUID;

ALTER TABLE "PlatformGapCandidate"
ADD COLUMN IF NOT EXISTS "questionKey" VARCHAR(512),
ADD COLUMN IF NOT EXISTS "orgSampleSize" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "requiresReview" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_PlatformGapCandidate_industry_questionKey"
ON "PlatformGapCandidate"("industry", "questionKey");

CREATE TABLE IF NOT EXISTS "RunbookSignal" (
    "id" UUID NOT NULL,
    "vertical" "IndustryType" NOT NULL,
    "escalationReason" VARCHAR(128) NOT NULL,
    "resolutionMotion" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "turnCount" INTEGER NOT NULL DEFAULT 0,
    "firstReplyResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_RunbookSignal" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IX_RunbookSignal_vertical_reason"
ON "RunbookSignal"("vertical", "escalationReason");

CREATE INDEX IF NOT EXISTS "IX_RunbookSignal_createdAt"
ON "RunbookSignal"("createdAt");

CREATE TABLE IF NOT EXISTS "SkillPerformanceScore" (
    "id" UUID NOT NULL,
    "vertical" "IndustryType" NOT NULL,
    "failureKey" VARCHAR(255) NOT NULL,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "orgSampleSize" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PK_SkillPerformanceScore" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_SkillPerformanceScore_window"
ON "SkillPerformanceScore"("vertical", "failureKey", "windowStart");

CREATE INDEX IF NOT EXISTS "IX_SkillPerformanceScore_vertical"
ON "SkillPerformanceScore"("vertical");
