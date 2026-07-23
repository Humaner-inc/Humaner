-- CreateEnum
CREATE TYPE "MailProvider" AS ENUM ('gmail', 'microsoft', 'imap');

-- CreateEnum
CREATE TYPE "MailConnectionStatus" AS ENUM ('active', 'needsReauth', 'disconnected', 'error');

-- CreateEnum
CREATE TYPE "MailThreadStatus" AS ENUM ('open', 'pending', 'resolved', 'snoozed');

-- CreateEnum
CREATE TYPE "MailMessageDirection" AS ENUM ('inbound', 'outbound');

-- AlterEnum
ALTER TYPE "HandoffTicketSource" ADD VALUE 'email';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "inboxConnectPromptPending" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MailboxConnection" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "provider" "MailProvider" NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "status" "MailConnectionStatus" NOT NULL DEFAULT 'active',
    "externalAccountId" VARCHAR(255),
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "scopes" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "imapHost" TEXT,
    "imapPort" INTEGER,
    "imapUser" TEXT,
    "imapPassword" TEXT,
    "imapTls" BOOLEAN NOT NULL DEFAULT true,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "smtpPassword" TEXT,
    "smtpTls" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "lastError" VARCHAR(2000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_MailboxConnection" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailAlias" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "connectionId" UUID NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(255),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_MailAlias" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailAliasMember" (
    "id" UUID NOT NULL,
    "aliasId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_MailAliasMember" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailThread" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "aliasId" UUID NOT NULL,
    "providerThreadId" VARCHAR(512) NOT NULL,
    "subject" VARCHAR(998) NOT NULL,
    "status" "MailThreadStatus" NOT NULL DEFAULT 'open',
    "assigneeId" UUID,
    "handoffTicketId" UUID,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_MailThread" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailMessage" (
    "id" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "providerMessageId" VARCHAR(512) NOT NULL,
    "direction" "MailMessageDirection" NOT NULL,
    "fromAddress" VARCHAR(255) NOT NULL,
    "toAddresses" TEXT[],
    "ccAddresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bodyText" TEXT,
    "bodyHtml" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_MailMessage" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailThreadNote" (
    "id" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_MailThreadNote" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IX_MailboxConnection_organizationId" ON "MailboxConnection"("organizationId");

-- CreateIndex
CREATE INDEX "IX_MailboxConnection_org_provider" ON "MailboxConnection"("organizationId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_MailboxConnection_org_email" ON "MailboxConnection"("organizationId", "email");

-- CreateIndex
CREATE INDEX "IX_MailAlias_connectionId" ON "MailAlias"("connectionId");

-- CreateIndex
CREATE INDEX "IX_MailAlias_organizationId" ON "MailAlias"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_MailAlias_org_address" ON "MailAlias"("organizationId", "address");

-- CreateIndex
CREATE INDEX "IX_MailAliasMember_userId" ON "MailAliasMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_MailAliasMember_alias_user" ON "MailAliasMember"("aliasId", "userId");

-- CreateIndex
CREATE INDEX "IX_MailThread_org_status_last" ON "MailThread"("organizationId", "status", "lastMessageAt");

-- CreateIndex
CREATE INDEX "IX_MailThread_assigneeId" ON "MailThread"("assigneeId");

-- CreateIndex
CREATE INDEX "IX_MailThread_handoffTicketId" ON "MailThread"("handoffTicketId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_MailThread_alias_providerThread" ON "MailThread"("aliasId", "providerThreadId");

-- CreateIndex
CREATE INDEX "IX_MailMessage_thread_sentAt" ON "MailMessage"("threadId", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_MailMessage_thread_providerMessage" ON "MailMessage"("threadId", "providerMessageId");

-- CreateIndex
CREATE INDEX "IX_MailThreadNote_threadId" ON "MailThreadNote"("threadId");

-- CreateIndex
CREATE INDEX "IX_MailThreadNote_authorId" ON "MailThreadNote"("authorId");

-- AddForeignKey
ALTER TABLE "MailboxConnection" ADD CONSTRAINT "MailboxConnection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailAlias" ADD CONSTRAINT "MailAlias_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailAlias" ADD CONSTRAINT "MailAlias_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "MailboxConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailAliasMember" ADD CONSTRAINT "MailAliasMember_aliasId_fkey" FOREIGN KEY ("aliasId") REFERENCES "MailAlias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailAliasMember" ADD CONSTRAINT "MailAliasMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailThread" ADD CONSTRAINT "MailThread_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailThread" ADD CONSTRAINT "MailThread_aliasId_fkey" FOREIGN KEY ("aliasId") REFERENCES "MailAlias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailThread" ADD CONSTRAINT "MailThread_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailThread" ADD CONSTRAINT "MailThread_handoffTicketId_fkey" FOREIGN KEY ("handoffTicketId") REFERENCES "HandoffTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailMessage" ADD CONSTRAINT "MailMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MailThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailThreadNote" ADD CONSTRAINT "MailThreadNote_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MailThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailThreadNote" ADD CONSTRAINT "MailThreadNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
