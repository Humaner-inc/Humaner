-- CreateTable
CREATE TABLE "AgentIntegration" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "channelId" VARCHAR(64) NOT NULL,
    "agentId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_AgentIntegration" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IX_AgentIntegration_agentId" ON "AgentIntegration"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_AgentIntegration_org_channel" ON "AgentIntegration"("organizationId", "channelId");

-- AddForeignKey
ALTER TABLE "AgentIntegration" ADD CONSTRAINT "AgentIntegration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentIntegration" ADD CONSTRAINT "AgentIntegration_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
