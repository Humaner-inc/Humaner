-- Mailbox foundation: drop unused CRM / Loops / eval tables,
-- keep HandoffTicket scalars, add Companion assignee + alias policy + notes draft.

ALTER TABLE "HandoffTicket" DROP CONSTRAINT IF EXISTS "HandoffTicket_clusterId_fkey";
ALTER TABLE "HandoffTicket" DROP CONSTRAINT IF EXISTS "HandoffTicket_runbookId_fkey";

DROP TABLE IF EXISTS "ClusterEntry" CASCADE;
DROP TABLE IF EXISTS "ResolutionCluster" CASCADE;
DROP TABLE IF EXISTS "Runbook" CASCADE;
DROP TABLE IF EXISTS "RunbookSignal" CASCADE;
DROP TABLE IF EXISTS "Favorite" CASCADE;
DROP TABLE IF EXISTS "ContactActivity" CASCADE;
DROP TABLE IF EXISTS "ContactComment" CASCADE;
DROP TABLE IF EXISTS "ContactImage" CASCADE;
DROP TABLE IF EXISTS "ContactNote" CASCADE;
DROP TABLE IF EXISTS "ContactPageVisit" CASCADE;
DROP TABLE IF EXISTS "ContactTask" CASCADE;
DROP TABLE IF EXISTS "_ContactToContactTag" CASCADE;
DROP TABLE IF EXISTS "Contact" CASCADE;
DROP TABLE IF EXISTS "ContactTag" CASCADE;
DROP TABLE IF EXISTS "Feedback" CASCADE;
DROP TABLE IF EXISTS "SupportTicketMessage" CASCADE;
DROP TABLE IF EXISTS "SupportTicket" CASCADE;
DROP TABLE IF EXISTS "EvalResult" CASCADE;
DROP TABLE IF EXISTS "AgentEvalRun" CASCADE;
DROP TABLE IF EXISTS "KnowledgeGap" CASCADE;
DROP TABLE IF EXISTS "KnowledgeGapCluster" CASCADE;
DROP TABLE IF EXISTS "PlatformGapCandidate" CASCADE;
DROP TABLE IF EXISTS "AgentDemoBackground" CASCADE;

CREATE TYPE "MailAssigneeKind" AS ENUM ('unassigned', 'human', 'companion');
CREATE TYPE "MailCompanionPolicy" AS ENUM ('draft', 'assign', 'send');

ALTER TABLE "MailAlias"
ADD COLUMN "companionPolicy" "MailCompanionPolicy" NOT NULL DEFAULT 'draft';

ALTER TABLE "MailThread"
ADD COLUMN "assigneeKind" "MailAssigneeKind" NOT NULL DEFAULT 'unassigned',
ADD COLUMN "sharedNoteDraft" TEXT,
ADD COLUMN "sharedNoteDraftUpdatedAt" TIMESTAMP(3),
ADD COLUMN "sharedNoteDraftAuthorId" UUID;

UPDATE "MailThread"
SET "assigneeKind" = 'human'
WHERE "assigneeId" IS NOT NULL;

CREATE INDEX "IX_MailThread_assigneeKind" ON "MailThread"("assigneeKind");
