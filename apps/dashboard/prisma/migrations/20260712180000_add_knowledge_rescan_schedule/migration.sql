-- CreateEnum
CREATE TYPE "KnowledgeRescanInterval" AS ENUM ('never', 'weekly', 'monthly');

-- AlterTable
ALTER TABLE "Agent"
ADD COLUMN "knowledgeRescanInterval" "KnowledgeRescanInterval" NOT NULL DEFAULT 'never',
ADD COLUMN "knowledgeLastRescanAt" TIMESTAMP(3);
