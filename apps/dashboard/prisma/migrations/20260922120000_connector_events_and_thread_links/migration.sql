CREATE TABLE IF NOT EXISTS "ConnectorEvent" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "connector" VARCHAR(32) NOT NULL,
  "direction" VARCHAR(8) NOT NULL,
  "status" VARCHAR(16) NOT NULL,
  "kind" VARCHAR(64) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "detail" VARCHAR(1000),
  "externalId" VARCHAR(255),
  "externalUrl" VARCHAR(2000),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),

  CONSTRAINT "PK_ConnectorEvent" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IX_ConnectorEvent_org_connector_created"
  ON "ConnectorEvent" ("organizationId", "connector", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "IX_ConnectorEvent_org_status_created"
  ON "ConnectorEvent" ("organizationId", "status", "createdAt" DESC);

ALTER TABLE "ConnectorEvent"
  ADD CONSTRAINT "ConnectorEvent_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "MailThreadConnectorLink" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "threadId" UUID NOT NULL,
  "connector" VARCHAR(32) NOT NULL,
  "externalId" VARCHAR(255) NOT NULL,
  "identifier" VARCHAR(64) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "url" VARCHAR(2000) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PK_MailThreadConnectorLink" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_MailThreadConnectorLink_thread_ext"
  ON "MailThreadConnectorLink" ("threadId", "connector", "externalId");

CREATE INDEX IF NOT EXISTS "IX_MailThreadConnectorLink_org_connector"
  ON "MailThreadConnectorLink" ("organizationId", "connector");

ALTER TABLE "MailThreadConnectorLink"
  ADD CONSTRAINT "MailThreadConnectorLink_threadId_fkey"
  FOREIGN KEY ("threadId") REFERENCES "MailThread"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
