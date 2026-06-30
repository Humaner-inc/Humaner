-- CreateEnum
CREATE TYPE "HandoffTicketSource" AS ENUM ('widget', 'api');

-- AlterTable
ALTER TABLE "HandoffTicket" ADD COLUMN "source" "HandoffTicketSource" NOT NULL DEFAULT 'widget';
