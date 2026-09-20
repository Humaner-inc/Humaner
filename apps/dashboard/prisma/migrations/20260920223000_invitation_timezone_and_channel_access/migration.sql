-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN "allowedAliasIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Invitation" ADD COLUMN "timeZone" VARCHAR(64);
