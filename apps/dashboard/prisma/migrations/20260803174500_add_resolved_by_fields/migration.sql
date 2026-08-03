-- Add resolvedBy / resolvedByName to HandoffTicket so the resolution summary
-- records who solved the ticket (human team member or AI Desk).

ALTER TABLE "HandoffTicket"
  ADD COLUMN "resolvedBy"     VARCHAR(8),
  ADD COLUMN "resolvedByName" VARCHAR(255);

-- Back-fill already-resolved tickets: if assignee exists → human, else unknown.
UPDATE "HandoffTicket"
SET "resolvedBy" = CASE
      WHEN "assigneeId" IS NOT NULL THEN 'human'
      WHEN "routedTo" = 'ai' THEN 'ai'
      ELSE NULL
    END,
    "resolvedByName" = CASE
      WHEN "assigneeId" IS NOT NULL THEN (
        SELECT u."name" FROM "User" u WHERE u."id" = "HandoffTicket"."assigneeId" LIMIT 1
      )
      WHEN "routedTo" = 'ai' THEN 'AI Desk'
      ELSE NULL
    END
WHERE "resolvedAt" IS NOT NULL;
