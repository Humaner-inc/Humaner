-- AlterTable
ALTER TABLE "HandoffTicket" ADD COLUMN "ticketNumber" INTEGER;

-- Backfill existing tickets with org-scoped sequential numbers
WITH numbered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "organizationId"
      ORDER BY "createdAt" ASC, id ASC
    ) AS rn
  FROM "HandoffTicket"
)
UPDATE "HandoffTicket" AS ht
SET "ticketNumber" = numbered.rn
FROM numbered
WHERE ht.id = numbered.id;

-- Make required after backfill
ALTER TABLE "HandoffTicket" ALTER COLUMN "ticketNumber" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UQ_HandoffTicket_organizationId_ticketNumber" ON "HandoffTicket"("organizationId", "ticketNumber");
