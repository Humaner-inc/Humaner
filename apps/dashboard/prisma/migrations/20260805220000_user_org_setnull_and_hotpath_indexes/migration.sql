-- Detach users from a deleted workspace instead of cascading account deletion.
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_organizationId_fkey";
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Hot-path indexes for billing, history, desk, and knowledge lists.
CREATE INDEX IF NOT EXISTS "IX_Message_role_createdAt"
  ON "Message"("role", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "IX_Conversation_agentId_updatedAt"
  ON "Conversation"("agentId", "updatedAt" DESC);

CREATE INDEX IF NOT EXISTS "IX_Agent_organizationId_createdAt"
  ON "Agent"("organizationId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "IX_KnowledgeGap_agentId_status_createdAt"
  ON "KnowledgeGap"("agentId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "IX_HandoffTicket_org_status_createdAt"
  ON "HandoffTicket"("organizationId", "status", "createdAt" DESC);
