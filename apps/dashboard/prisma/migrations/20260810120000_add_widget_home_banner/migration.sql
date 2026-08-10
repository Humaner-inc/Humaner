-- AlterTable
ALTER TABLE "Agent" ADD COLUMN "widgetHomeBannerUrl" VARCHAR(2048);

-- CreateTable
CREATE TABLE "AgentWidgetHomeBanner" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "data" BYTEA,
    "contentType" VARCHAR(255),
    "hash" VARCHAR(64),

    CONSTRAINT "PK_AgentWidgetHomeBanner" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IX_AgentWidgetHomeBanner_agentId" ON "AgentWidgetHomeBanner"("agentId");
