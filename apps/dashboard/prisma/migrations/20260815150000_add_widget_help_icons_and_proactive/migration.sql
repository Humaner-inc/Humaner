-- AlterTable
ALTER TABLE "Agent" ADD COLUMN "widgetHelpIconsAnimated" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Agent" ADD COLUMN "widgetProactiveEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Agent" ADD COLUMN "widgetProactiveMessage" VARCHAR(280);
ALTER TABLE "Agent" ADD COLUMN "widgetProactiveDelaySeconds" INTEGER NOT NULL DEFAULT 8;

-- CreateTable
CREATE TABLE "WidgetProactiveMessage" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "visitorId" VARCHAR(255) NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_WidgetProactiveMessage" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IX_WidgetProactiveMessage_pending" ON "WidgetProactiveMessage"("agentId", "visitorId", "deliveredAt");

-- CreateIndex
CREATE INDEX "IX_WidgetProactiveMessage_expiresAt" ON "WidgetProactiveMessage"("expiresAt");

-- AddForeignKey
ALTER TABLE "WidgetProactiveMessage" ADD CONSTRAINT "WidgetProactiveMessage_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
