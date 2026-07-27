-- AlterTable
ALTER TABLE "Agent" ADD COLUMN "widgetConversationHomeEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "sessionId" VARCHAR(255);

-- CreateIndex
CREATE INDEX "IX_Conversation_agent_visitor_session" ON "Conversation"("agentId", "visitorId", "sessionId");
