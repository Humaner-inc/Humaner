-- AlterTable HandoffTicket: Why/How summaries + resolution metadata
ALTER TABLE "HandoffTicket" ADD COLUMN "whySummary" TEXT;
ALTER TABLE "HandoffTicket" ADD COLUMN "howSummary" TEXT;
ALTER TABLE "HandoffTicket" ADD COLUMN "resolutionPattern" VARCHAR(255);
ALTER TABLE "HandoffTicket" ADD COLUMN "issueType" VARCHAR(128);
ALTER TABLE "HandoffTicket" ADD COLUMN "resolutionSolution" TEXT;

-- CreateEnum RunbookReviewStatus
CREATE TYPE "RunbookReviewStatus" AS ENUM ('pendingReview', 'approved');

-- AlterTable Runbook
ALTER TABLE "Runbook" ADD COLUMN "reviewStatus" "RunbookReviewStatus" NOT NULL DEFAULT 'approved';

-- AlterTable ResolutionCluster: pattern > issue type hierarchy
ALTER TABLE "ResolutionCluster" ADD COLUMN "pattern" VARCHAR(255);
ALTER TABLE "ResolutionCluster" ADD COLUMN "issueType" VARCHAR(128) NOT NULL DEFAULT 'general';

-- Backfill pattern from title for existing rows
UPDATE "ResolutionCluster" SET "pattern" = "title" WHERE "pattern" IS NULL;
ALTER TABLE "ResolutionCluster" ALTER COLUMN "pattern" SET NOT NULL;
