ALTER TABLE "Agent" ADD COLUMN "image" VARCHAR(2048);
ALTER TABLE "Agent" ADD COLUMN "showRole" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "AgentImage" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "data" BYTEA,
    "contentType" VARCHAR(255),
    "hash" VARCHAR(64),

    CONSTRAINT "PK_AgentImage" PRIMARY KEY ("id")
);

CREATE INDEX "IX_AgentImage_agentId" ON "AgentImage"("agentId");
