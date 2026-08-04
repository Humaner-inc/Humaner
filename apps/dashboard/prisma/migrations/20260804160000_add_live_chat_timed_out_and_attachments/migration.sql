-- AlterTable: HandoffTicket — track when live chat timed out
ALTER TABLE "HandoffTicket"
ADD COLUMN "liveChatTimedOut" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Message — optional attachment metadata (JSON)
ALTER TABLE "Message"
ADD COLUMN "attachments" JSONB;
