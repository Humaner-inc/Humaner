CREATE TABLE IF NOT EXISTS "McpRequestLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "method" VARCHAR(64) NOT NULL,
    "tool" VARCHAR(64) NOT NULL,
    "status" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "apiKeyId" UUID,
    "errorMessage" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_McpRequestLog" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IX_McpRequestLog_organizationId_createdAt"
  ON "McpRequestLog" ("organizationId", "createdAt" DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'McpRequestLog_organizationId_fkey'
  ) THEN
    ALTER TABLE "McpRequestLog"
      ADD CONSTRAINT "McpRequestLog_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
