-- Add per-agent training focus topics
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "trainingTopics" TEXT[] DEFAULT ARRAY[]::TEXT[];
