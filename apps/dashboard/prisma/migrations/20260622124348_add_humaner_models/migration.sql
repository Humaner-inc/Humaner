/*
  Warnings:

  - You are about to drop the column `stripeCustomerId` on the `Organization` table. All the data in the column will be lost.
  - You are about to alter the column `tier` on the `Organization` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(32)`.

*/
-- CreateEnum
CREATE TYPE "CharacterType" AS ENUM ('casual', 'corporate', 'bold');

-- CreateEnum
CREATE TYPE "Verbosity" AS ENUM ('concise', 'balanced', 'detailed');

-- CreateEnum
CREATE TYPE "Formality" AS ENUM ('relaxed', 'standard', 'elevated');

-- CreateEnum
CREATE TYPE "EmojiMode" AS ENUM ('none', 'subtle', 'expressive');

-- CreateEnum
CREATE TYPE "OpenerStyle" AS ENUM ('direct', 'warm', 'mirroring');

-- CreateEnum
CREATE TYPE "IndustryType" AS ENUM ('ecommerce', 'education', 'fitness', 'travel');

-- CreateEnum
CREATE TYPE "UseCaseType" AS ENUM ('support', 'sales');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('url', 'pdf', 'text');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('pending', 'processing', 'ready', 'failed');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant');

-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('pendingReview', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "WidgetPosition" AS ENUM ('bottomRight', 'bottomLeft');

-- DropIndex
DROP INDEX "IX_Organization_stripeCustomerId";

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "stripeCustomerId",
ADD COLUMN     "polarCustomerId" VARCHAR(255),
ALTER COLUMN "tier" SET DATA TYPE VARCHAR(32);

-- CreateTable
CREATE TABLE "Agent" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(255) NOT NULL,
    "character" "CharacterType" NOT NULL DEFAULT 'casual',
    "industry" "IndustryType" NOT NULL DEFAULT 'ecommerce',
    "useCase" "UseCaseType" NOT NULL DEFAULT 'support',
    "verbosity" "Verbosity" NOT NULL DEFAULT 'balanced',
    "formality" "Formality" NOT NULL DEFAULT 'standard',
    "emojiMode" "EmojiMode" NOT NULL DEFAULT 'none',
    "openerStyle" "OpenerStyle" NOT NULL DEFAULT 'direct',
    "allowTypos" BOOLEAN NOT NULL DEFAULT false,
    "forbiddenTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fallbackMessage" VARCHAR(2000) NOT NULL DEFAULT 'I don''t have that information yet. A team member will follow up shortly.',
    "allowedDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "widgetColor" VARCHAR(32) NOT NULL DEFAULT '#6366f1',
    "widgetPosition" "WidgetPosition" NOT NULL DEFAULT 'bottomRight',
    "voiceEnabled" BOOLEAN NOT NULL DEFAULT false,
    "voiceId" VARCHAR(255),
    "publicId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_Agent" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeSource" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "type" "SourceType" NOT NULL,
    "url" VARCHAR(2048),
    "title" VARCHAR(255) NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'pending',
    "contentHash" VARCHAR(128),
    "pageCount" INTEGER,
    "lastSyncedAt" TIMESTAMP(3),
    "errorMessage" VARCHAR(2000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_KnowledgeSource" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chunk" (
    "id" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "heading" VARCHAR(512),
    "tokenCount" INTEGER NOT NULL,
    "pageUrl" VARCHAR(2048),
    "chunkIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_Chunk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "visitorId" VARCHAR(255) NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_Conversation" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "unanswered" BOOLEAN NOT NULL DEFAULT false,
    "failureReason" VARCHAR(2000),
    "isVoice" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_Message" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeSourceDraft" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "sourceMessageIds" TEXT[],
    "status" "DraftStatus" NOT NULL DEFAULT 'pendingReview',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_KnowledgeSourceDraft" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_publicId_key" ON "Agent"("publicId");

-- CreateIndex
CREATE INDEX "IX_Agent_organizationId" ON "Agent"("organizationId");

-- CreateIndex
CREATE INDEX "IX_Agent_publicId" ON "Agent"("publicId");

-- CreateIndex
CREATE INDEX "IX_KnowledgeSource_agentId" ON "KnowledgeSource"("agentId");

-- CreateIndex
CREATE INDEX "IX_Chunk_sourceId" ON "Chunk"("sourceId");

-- CreateIndex
CREATE INDEX "IX_Chunk_agentId" ON "Chunk"("agentId");

-- CreateIndex
CREATE INDEX "IX_Conversation_agentId" ON "Conversation"("agentId");

-- CreateIndex
CREATE INDEX "IX_Conversation_visitorId" ON "Conversation"("visitorId");

-- CreateIndex
CREATE INDEX "IX_Message_conversationId" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "IX_KnowledgeSourceDraft_agentId" ON "KnowledgeSourceDraft"("agentId");

-- CreateIndex
CREATE INDEX "IX_Organization_polarCustomerId" ON "Organization"("polarCustomerId");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeSource" ADD CONSTRAINT "KnowledgeSource_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chunk" ADD CONSTRAINT "Chunk_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "KnowledgeSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chunk" ADD CONSTRAINT "Chunk_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeSourceDraft" ADD CONSTRAINT "KnowledgeSourceDraft_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
