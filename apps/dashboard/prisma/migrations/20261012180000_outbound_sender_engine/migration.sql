-- Outbound sender engine: spread, random send gap, outbound mailbox role + state.

ALTER TABLE "OutboundWave"
  ADD COLUMN "spreadBatchSize" INTEGER,
  ADD COLUMN "spreadEveryMinutes" INTEGER,
  ADD COLUMN "gapMinMinutes" INTEGER,
  ADD COLUMN "gapMaxMinutes" INTEGER;

ALTER TABLE "OutboundWaveRecipient"
  ADD COLUMN "scheduledFor" TIMESTAMP(3);

CREATE TYPE "OutboundMailboxState" AS ENUM ('WARMING', 'READY', 'PAUSED');

CREATE TABLE "OutboundMailbox" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "aliasId" UUID NOT NULL,
  "state" "OutboundMailboxState" NOT NULL DEFAULT 'READY',
  "dailyCap" INTEGER NOT NULL DEFAULT 20,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PK_OutboundMailbox" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UQ_OutboundMailbox_alias" ON "OutboundMailbox"("aliasId");
CREATE INDEX "IX_OutboundMailbox_organizationId" ON "OutboundMailbox"("organizationId");

ALTER TABLE "OutboundMailbox"
  ADD CONSTRAINT "OutboundMailbox_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "OutboundMailbox_aliasId_fkey" FOREIGN KEY ("aliasId") REFERENCES "MailAlias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
