-- Vertical release bundle + VERTICAL_RELEASE eval run type
ALTER TYPE "EvalRunType" ADD VALUE IF NOT EXISTS 'verticalRelease';

CREATE TABLE IF NOT EXISTS "VerticalRelease" (
  "id" TEXT NOT NULL,
  "industry" "IndustryType" NOT NULL,
  "version" TEXT NOT NULL,
  "certified" BOOLEAN NOT NULL DEFAULT false,
  "certificate" JSONB NOT NULL,
  "personaPreset" JSONB NOT NULL,
  "intentTaxonomy" JSONB NOT NULL,
  "routingConfig" JSONB NOT NULL,
  "chunkCount" INTEGER NOT NULL DEFAULT 0,
  "promotedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PK_VerticalRelease" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_VerticalRelease_industry_version"
  ON "VerticalRelease"("industry", "version");

CREATE INDEX IF NOT EXISTS "IX_VerticalRelease_industry"
  ON "VerticalRelease"("industry");
