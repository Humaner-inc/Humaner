-- CreateEnum
CREATE TYPE "AgentLoopMode" AS ENUM ('autoSolve', 'approval');

-- CreateEnum
CREATE TYPE "LoopStatus" AS ENUM ('solving', 'draftReady', 'approved', 'rejected', 'failed');

-- AlterTable Organization: Agent Loops mode
ALTER TABLE "Organization" ADD COLUMN "agentLoopMode" "AgentLoopMode" NOT NULL DEFAULT 'approval';

-- AlterTable Agent: rename aiDeskEnabled → agentDeskEnabled
ALTER TABLE "Agent" RENAME COLUMN "aiDeskEnabled" TO "agentDeskEnabled";

-- AlterTable HandoffTicket: Agent Loops fields
ALTER TABLE "HandoffTicket" ADD COLUMN "loopStatus" "LoopStatus";
ALTER TABLE "HandoffTicket" ADD COLUMN "draftSolution" TEXT;
ALTER TABLE "HandoffTicket" ADD COLUMN "loopSolvedAt" TIMESTAMP(3);
ALTER TABLE "HandoffTicket" ADD COLUMN "loopError" VARCHAR(512);

-- Backfill resolvedByName display string
UPDATE "HandoffTicket"
SET "resolvedByName" = 'Agent Desk'
WHERE "resolvedByName" = 'AI Desk';

-- CreateIndex
CREATE INDEX "IX_HandoffTicket_org_loopStatus" ON "HandoffTicket"("organizationId", "loopStatus");
