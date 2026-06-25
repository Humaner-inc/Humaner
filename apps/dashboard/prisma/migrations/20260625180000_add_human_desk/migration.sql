-- CreateEnum
CREATE TYPE "HandoffTicketStatus" AS ENUM ('open', 'inProgress', 'resolved', 'closed');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "humanDeskEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "HandoffTicket" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "conversationId" UUID,
    "visitorId" VARCHAR(255),
    "visitorEmail" VARCHAR(255),
    "subject" VARCHAR(255) NOT NULL,
    "summary" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "note" TEXT,
    "status" "HandoffTicketStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_HandoffTicket" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IX_HandoffTicket_organizationId" ON "HandoffTicket"("organizationId");

-- CreateIndex
CREATE INDEX "IX_HandoffTicket_agentId" ON "HandoffTicket"("agentId");

-- CreateIndex
CREATE INDEX "IX_HandoffTicket_status" ON "HandoffTicket"("status");

-- AddForeignKey
ALTER TABLE "HandoffTicket" ADD CONSTRAINT "HandoffTicket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoffTicket" ADD CONSTRAINT "HandoffTicket_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoffTicket" ADD CONSTRAINT "HandoffTicket_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
