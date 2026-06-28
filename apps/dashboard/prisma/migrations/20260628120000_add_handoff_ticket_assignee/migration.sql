-- AlterTable
ALTER TABLE "HandoffTicket" ADD COLUMN "assigneeId" UUID;
ALTER TABLE "HandoffTicket" ADD COLUMN "assignedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "IX_HandoffTicket_assigneeId" ON "HandoffTicket"("assigneeId");
CREATE INDEX "IX_HandoffTicket_org_status_updated" ON "HandoffTicket"("organizationId", "status", "updatedAt");

-- AddForeignKey
ALTER TABLE "HandoffTicket" ADD CONSTRAINT "HandoffTicket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
