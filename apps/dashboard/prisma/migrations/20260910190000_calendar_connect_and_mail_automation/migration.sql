-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "calendarMailAutomation" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "CalendarProvider" AS ENUM ('google', 'calendly', 'outlook');

-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN "source" VARCHAR(32) NOT NULL DEFAULT 'manual';
ALTER TABLE "CalendarEvent" ADD COLUMN "sourceKey" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_CalendarEvent_organizationId_sourceKey" ON "CalendarEvent"("organizationId", "sourceKey");

-- CreateTable
CREATE TABLE "CalendarConnection" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "provider" "CalendarProvider" NOT NULL,
    "accountEmail" VARCHAR(255) NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_CalendarConnection" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_CalendarConnection_organizationId_provider" ON "CalendarConnection"("organizationId", "provider");

-- CreateIndex
CREATE INDEX "IX_CalendarConnection_createdById" ON "CalendarConnection"("createdById");

-- AddForeignKey
ALTER TABLE "CalendarConnection" ADD CONSTRAINT "CalendarConnection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarConnection" ADD CONSTRAINT "CalendarConnection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
