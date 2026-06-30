-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "liveChatEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "liveChatTimeoutMinutes" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN "liveChatTimeoutMessage" VARCHAR(2000);
