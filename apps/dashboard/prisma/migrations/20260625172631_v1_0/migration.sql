/*
  Warnings:

  - The `industry` column on the `AgentEvalRun` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `runType` column on the `AgentEvalRun` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `questionType` column on the `EvalResult` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `KnowledgeGap` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `source` column on the `PlatformChunk` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `PlatformGapCandidate` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `industry` on the `PlatformChunk` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `industry` on the `PlatformGapCandidate` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PlatformChunkSource" AS ENUM ('synthetic', 'curatedReal');

-- CreateEnum
CREATE TYPE "EvalRunType" AS ENUM ('manual', 'autoNewSource', 'autoConfig', 'autoWeekly', 'platform');

-- CreateEnum
CREATE TYPE "QuestionCategory" AS ENUM ('common', 'edge', 'trap', 'escalation');

-- CreateEnum
CREATE TYPE "KnowledgeGapStatus" AS ENUM ('pending', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "PlatformGapStatus" AS ENUM ('pending', 'inEval', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "Agent" ALTER COLUMN "widgetColor" SET DEFAULT '#6b2d3a';

-- AlterTable
ALTER TABLE "AgentEvalRun" DROP COLUMN "industry",
ADD COLUMN     "industry" "IndustryType",
DROP COLUMN "runType",
ADD COLUMN     "runType" "EvalRunType" NOT NULL DEFAULT 'manual';

-- AlterTable
ALTER TABLE "EvalResult" DROP COLUMN "questionType",
ADD COLUMN     "questionType" "QuestionCategory";

-- AlterTable
ALTER TABLE "KnowledgeGap" DROP COLUMN "status",
ADD COLUMN     "status" "KnowledgeGapStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "PlatformChunk" DROP COLUMN "industry",
ADD COLUMN     "industry" "IndustryType" NOT NULL,
DROP COLUMN "source",
ADD COLUMN     "source" "PlatformChunkSource" NOT NULL DEFAULT 'synthetic';

-- AlterTable
ALTER TABLE "PlatformGapCandidate" DROP COLUMN "industry",
ADD COLUMN     "industry" "IndustryType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "PlatformGapStatus" NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "IX_AgentEvalRun_industry" ON "AgentEvalRun"("industry");

-- CreateIndex
CREATE INDEX "IX_KnowledgeGap_status" ON "KnowledgeGap"("status");

-- CreateIndex
CREATE INDEX "IX_PlatformChunk_industry" ON "PlatformChunk"("industry");

-- CreateIndex
CREATE INDEX "IX_PlatformGapCandidate_industry" ON "PlatformGapCandidate"("industry");

-- CreateIndex
CREATE INDEX "IX_PlatformGapCandidate_status" ON "PlatformGapCandidate"("status");
