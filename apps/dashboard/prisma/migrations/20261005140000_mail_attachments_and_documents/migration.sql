-- Cloud-only: inbound mail attachments + mail-sourced invoices/quotes.

-- CreateEnum
CREATE TYPE "WorkspaceDocumentKind" AS ENUM ('INVOICE', 'QUOTE');

-- CreateEnum
CREATE TYPE "WorkspaceDocumentStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'ACCEPTED', 'DECLINED', 'VOID');

-- AlterTable
ALTER TABLE "MailThread" ADD COLUMN IF NOT EXISTS "hasAttachments" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MailMessageAttachment" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "filename" VARCHAR(512) NOT NULL,
    "mediaType" VARCHAR(255) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" VARCHAR(1024) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_MailMessageAttachment" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceDocument" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "kind" "WorkspaceDocumentKind" NOT NULL,
    "status" "WorkspaceDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "reference" VARCHAR(32) NOT NULL,
    "sequence" INTEGER NOT NULL,
    "counterpartyName" VARCHAR(255),
    "counterpartyEmail" VARCHAR(255),
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "sourceThreadId" UUID,
    "sourceMessageId" UUID,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "htmlStorageKey" VARCHAR(1024),
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_WorkspaceDocument" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IX_MailMessageAttachment_messageId" ON "MailMessageAttachment"("messageId");

-- CreateIndex
CREATE INDEX "IX_MailMessageAttachment_organizationId" ON "MailMessageAttachment"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_WorkspaceDocument_org_kind_sequence" ON "WorkspaceDocument"("organizationId", "kind", "sequence");

-- CreateIndex
CREATE INDEX "IX_WorkspaceDocument_org_kind_created" ON "WorkspaceDocument"("organizationId", "kind", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "IX_WorkspaceDocument_sourceThreadId" ON "WorkspaceDocument"("sourceThreadId");

-- AddForeignKey
ALTER TABLE "MailMessageAttachment" ADD CONSTRAINT "MailMessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "MailMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailMessageAttachment" ADD CONSTRAINT "MailMessageAttachment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceDocument" ADD CONSTRAINT "WorkspaceDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceDocument" ADD CONSTRAINT "WorkspaceDocument_sourceThreadId_fkey" FOREIGN KEY ("sourceThreadId") REFERENCES "MailThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;
