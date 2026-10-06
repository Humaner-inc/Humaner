-- Outbound Waves (Cloud): prospects, ICPs, templates, waves, suppression.

CREATE TYPE "OutboundProspectStatus" AS ENUM ('NEW', 'ENRICHED', 'CONTACTED', 'REPLIED', 'BOUNCED');
CREATE TYPE "OutboundWaveStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'SENDING', 'DONE', 'PAUSED');
CREATE TYPE "OutboundRecipientApproval" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "OutboundSuppressionReason" AS ENUM ('BOUNCED', 'MANUAL', 'UNSUBSCRIBED');

CREATE TABLE "OutboundProspect" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "company" VARCHAR(255),
    "domain" VARCHAR(255),
    "role" VARCHAR(255),
    "industry" VARCHAR(128),
    "source" VARCHAR(128),
    "status" "OutboundProspectStatus" NOT NULL DEFAULT 'NEW',
    "obsidianPath" VARCHAR(1024),
    "personalization" JSONB,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "lastContactedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_OutboundProspect" PRIMARY KEY ("id")
);

CREATE TABLE "OutboundIcp" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_OutboundIcp" PRIMARY KEY ("id")
);

CREATE TABLE "OutboundTemplate" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(998) NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_OutboundTemplate" PRIMARY KEY ("id")
);

CREATE TABLE "OutboundWave" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "idea" VARCHAR(512),
    "templateId" UUID,
    "templateSnapshot" JSONB,
    "status" "OutboundWaveStatus" NOT NULL DEFAULT 'DRAFT',
    "bouncePauseThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "mailTagId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "sendingStartedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PK_OutboundWave" PRIMARY KEY ("id")
);

CREATE TABLE "OutboundWaveMailbox" (
    "id" UUID NOT NULL,
    "waveId" UUID NOT NULL,
    "aliasId" UUID NOT NULL,
    "dailyCap" INTEGER NOT NULL DEFAULT 20,
    "sendCursor" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_OutboundWaveMailbox" PRIMARY KEY ("id")
);

CREATE TABLE "OutboundWaveRecipient" (
    "id" UUID NOT NULL,
    "waveId" UUID NOT NULL,
    "prospectId" UUID NOT NULL,
    "aliasId" UUID,
    "subject" VARCHAR(998) NOT NULL,
    "body" TEXT NOT NULL,
    "approval" "OutboundRecipientApproval" NOT NULL DEFAULT 'PENDING',
    "rfcMessageId" VARCHAR(512),
    "mailThreadId" UUID,
    "mailMessageId" UUID,
    "sentAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "bounceAt" TIMESTAMP(3),
    "isAutoReply" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_OutboundWaveRecipient" PRIMARY KEY ("id")
);

CREATE TABLE "OutboundSuppression" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "email" VARCHAR(255),
    "domain" VARCHAR(255),
    "reason" "OutboundSuppressionReason" NOT NULL,
    "notes" VARCHAR(512),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_OutboundSuppression" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UQ_OutboundProspect_org_email" ON "OutboundProspect"("organizationId", "email");
CREATE INDEX "IX_OutboundProspect_org_status" ON "OutboundProspect"("organizationId", "status");
CREATE INDEX "IX_OutboundProspect_org_domain" ON "OutboundProspect"("organizationId", "domain");

CREATE INDEX "IX_OutboundIcp_organizationId" ON "OutboundIcp"("organizationId");
CREATE INDEX "IX_OutboundTemplate_organizationId" ON "OutboundTemplate"("organizationId");

CREATE INDEX "IX_OutboundWave_org_status" ON "OutboundWave"("organizationId", "status");
CREATE INDEX "IX_OutboundWave_templateId" ON "OutboundWave"("templateId");

CREATE UNIQUE INDEX "UQ_OutboundWaveMailbox_wave_alias" ON "OutboundWaveMailbox"("waveId", "aliasId");
CREATE INDEX "IX_OutboundWaveMailbox_aliasId" ON "OutboundWaveMailbox"("aliasId");

CREATE UNIQUE INDEX "UQ_OutboundWaveRecipient_wave_prospect" ON "OutboundWaveRecipient"("waveId", "prospectId");
CREATE INDEX "IX_OutboundWaveRecipient_send_queue" ON "OutboundWaveRecipient"("waveId", "approval", "sentAt");
CREATE INDEX "IX_OutboundWaveRecipient_mailThreadId" ON "OutboundWaveRecipient"("mailThreadId");
CREATE INDEX "IX_OutboundWaveRecipient_rfcMessageId" ON "OutboundWaveRecipient"("rfcMessageId");
CREATE INDEX "IX_OutboundWaveRecipient_prospectId" ON "OutboundWaveRecipient"("prospectId");

CREATE INDEX "IX_OutboundSuppression_org_email" ON "OutboundSuppression"("organizationId", "email");
CREATE INDEX "IX_OutboundSuppression_org_domain" ON "OutboundSuppression"("organizationId", "domain");

ALTER TABLE "OutboundProspect" ADD CONSTRAINT "OutboundProspect_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutboundIcp" ADD CONSTRAINT "OutboundIcp_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutboundTemplate" ADD CONSTRAINT "OutboundTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutboundWave" ADD CONSTRAINT "OutboundWave_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutboundWave" ADD CONSTRAINT "OutboundWave_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "OutboundTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OutboundWaveMailbox" ADD CONSTRAINT "OutboundWaveMailbox_waveId_fkey" FOREIGN KEY ("waveId") REFERENCES "OutboundWave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutboundWaveMailbox" ADD CONSTRAINT "OutboundWaveMailbox_aliasId_fkey" FOREIGN KEY ("aliasId") REFERENCES "MailAlias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutboundWaveRecipient" ADD CONSTRAINT "OutboundWaveRecipient_waveId_fkey" FOREIGN KEY ("waveId") REFERENCES "OutboundWave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutboundWaveRecipient" ADD CONSTRAINT "OutboundWaveRecipient_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "OutboundProspect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutboundWaveRecipient" ADD CONSTRAINT "OutboundWaveRecipient_aliasId_fkey" FOREIGN KEY ("aliasId") REFERENCES "MailAlias"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OutboundSuppression" ADD CONSTRAINT "OutboundSuppression_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
