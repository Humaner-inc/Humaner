-- Workspace-wide team messages, visible to every member.
CREATE TABLE IF NOT EXISTS "TeamMessage" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_TeamMessage" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IX_TeamMessage_organizationId_createdAt"
ON "TeamMessage"("organizationId", "createdAt");

CREATE INDEX IF NOT EXISTS "IX_TeamMessage_authorId"
ON "TeamMessage"("authorId");

ALTER TABLE "TeamMessage"
ADD CONSTRAINT "TeamMessage_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamMessage"
ADD CONSTRAINT "TeamMessage_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
