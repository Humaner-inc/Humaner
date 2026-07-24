-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('user', 'system');

-- CreateTable
-- No FK to Organization: rows must survive workspace deletion for the 2-year retention window.
-- id is supplied by Prisma (@default(uuid())) — no DB default, matching other tables.
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "eventType" VARCHAR(64) NOT NULL,
    "actorType" "AuditActorType" NOT NULL DEFAULT 'user',
    "actorId" VARCHAR(255),
    "actorEmail" VARCHAR(255),
    "ipAddress" VARCHAR(64),
    "resourceType" VARCHAR(64),
    "resourceId" VARCHAR(255),
    "beforeState" JSONB,
    "afterState" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_AuditLog" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IX_AuditLog_organizationId_createdAt" ON "AuditLog"("organizationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "IX_AuditLog_organizationId_eventType" ON "AuditLog"("organizationId", "eventType");

-- Immutability: block UPDATE always; allow DELETE only when retention cron sets app.allow_audit_purge.
-- TRUNCATE bypasses row DELETE triggers — block it explicitly.
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'TRUNCATE' THEN
    RAISE EXCEPTION 'AuditLog records are immutable (TRUNCATE forbidden)';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'AuditLog records are immutable (UPDATE forbidden)';
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF current_setting('app.allow_audit_purge', true) IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'AuditLog records are immutable (DELETE forbidden)';
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_log_immutable
  BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW
  EXECUTE PROCEDURE prevent_audit_log_mutation();

CREATE TRIGGER trg_audit_log_no_truncate
  BEFORE TRUNCATE ON "AuditLog"
  FOR EACH STATEMENT
  EXECUTE PROCEDURE prevent_audit_log_mutation();
