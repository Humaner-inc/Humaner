-- AlterTable
ALTER TABLE "Agent" ADD COLUMN "demoBackgroundUrl" VARCHAR(2048);

-- CreateTable
CREATE TABLE "AgentDemoBackground" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "data" BYTEA,
    "contentType" VARCHAR(255),
    "hash" VARCHAR(64),

    CONSTRAINT "PK_AgentDemoBackground" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IX_AgentDemoBackground_agentId" ON "AgentDemoBackground"("agentId");
