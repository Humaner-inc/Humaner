-- Target audience (B2C / B2B) for industry-specific handling.

CREATE TYPE "TargetAudience" AS ENUM ('b2c', 'b2b');

ALTER TABLE "Organization"
  ADD COLUMN "targetAudience" "TargetAudience",
  ADD COLUMN "tosAcceptedAt" TIMESTAMP(3);
