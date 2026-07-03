-- CreateEnum
CREATE TYPE "WidgetBubbleIcon" AS ENUM ('chat', 'message', 'sparkle');

-- CreateEnum
CREATE TYPE "WidgetSendIcon" AS ENUM ('send', 'arrowUp', 'chevron');

-- AlterTable
ALTER TABLE "Agent"
ADD COLUMN "widgetBubbleIcon" "WidgetBubbleIcon" NOT NULL DEFAULT 'chat',
ADD COLUMN "widgetSendIcon" "WidgetSendIcon" NOT NULL DEFAULT 'send';
