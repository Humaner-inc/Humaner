-- Paid seat and mailbox add-ons on top of the one seat / one mailbox Inbox includes.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PolarAddonKind') THEN
    CREATE TYPE "PolarAddonKind" AS ENUM ('SEAT', 'MAILBOX');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "PolarAddonSubscription" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "polarSubscriptionId" VARCHAR(255) NOT NULL,
  "ownerId" UUID NOT NULL,
  "kind" "PolarAddonKind" NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "productId" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PK_PolarAddonSubscription" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_PolarAddonSubscription_polarSubscriptionId"
  ON "PolarAddonSubscription" ("polarSubscriptionId");

CREATE INDEX IF NOT EXISTS "IX_PolarAddonSubscription_ownerId_active"
  ON "PolarAddonSubscription" ("ownerId", "active");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FK_PolarAddonSubscription_ownerId'
  ) THEN
    ALTER TABLE "PolarAddonSubscription"
      ADD CONSTRAINT "FK_PolarAddonSubscription_ownerId"
      FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Mirrored counters summed from the ledger above.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "extraSeats" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "extraMailboxes" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "extraSeats" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "extraMailboxes" INTEGER NOT NULL DEFAULT 0;
