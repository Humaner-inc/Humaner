-- CreateEnum
CREATE TYPE "CompanySize" AS ENUM ('solo', 'small', 'medium', 'large', 'enterprise');

-- AlterTable
ALTER TABLE "Organization"
ADD COLUMN "companySize" "CompanySize",
ADD COLUMN "docsUrl" VARCHAR(2000),
ADD COLUMN "onboardingIntegrations" TEXT[] DEFAULT ARRAY[]::TEXT[];
