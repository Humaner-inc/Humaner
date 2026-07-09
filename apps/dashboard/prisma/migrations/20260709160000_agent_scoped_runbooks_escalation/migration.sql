-- Add agentId to Runbook and EscalationPolicy (per-agent scope)

ALTER TABLE "Runbook" ADD COLUMN "agentId" UUID;

UPDATE "Runbook" r
SET "agentId" = (
  SELECT a.id FROM "Agent" a
  WHERE a."organizationId" = r."organizationId"
  ORDER BY a."createdAt" ASC
  LIMIT 1
)
WHERE r."agentId" IS NULL;

ALTER TABLE "Runbook" ALTER COLUMN "agentId" SET NOT NULL;
ALTER TABLE "Runbook" ADD CONSTRAINT "Runbook_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "IX_Runbook_agentId" ON "Runbook"("agentId");

ALTER TABLE "EscalationPolicy" ADD COLUMN "agentId" UUID;

UPDATE "EscalationPolicy" ep
SET "agentId" = (
  SELECT a.id FROM "Agent" a
  WHERE a."organizationId" = ep."organizationId"
  ORDER BY a."createdAt" ASC
  LIMIT 1
)
WHERE ep."agentId" IS NULL;

ALTER TABLE "EscalationPolicy" ALTER COLUMN "agentId" SET NOT NULL;
ALTER TABLE "EscalationPolicy" ADD CONSTRAINT "EscalationPolicy_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "IX_EscalationPolicy_agentId" ON "EscalationPolicy"("agentId");
