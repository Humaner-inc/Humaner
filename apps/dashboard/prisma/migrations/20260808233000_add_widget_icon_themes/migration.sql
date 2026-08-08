-- CreateEnum
CREATE TYPE "WidgetIconTheme" AS ENUM ('dark', 'light');

-- AlterTable
ALTER TABLE "Agent"
ADD COLUMN "widgetTheme" "WidgetIconTheme" NOT NULL DEFAULT 'dark';
