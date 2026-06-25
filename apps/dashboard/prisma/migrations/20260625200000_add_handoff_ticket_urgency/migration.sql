-- CreateEnum
CREATE TYPE "HandoffTicketUrgency" AS ENUM ('low', 'medium', 'high');

-- AlterTable
ALTER TABLE "HandoffTicket" ADD COLUMN "urgency" "HandoffTicketUrgency" NOT NULL DEFAULT 'medium';
