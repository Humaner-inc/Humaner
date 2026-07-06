-- AlterTable
ALTER TABLE "HandoffTicket" ADD COLUMN "visitorFirstName" VARCHAR(128);
ALTER TABLE "HandoffTicket" ADD COLUMN "visitorLastName" VARCHAR(128);
ALTER TABLE "HandoffTicket" ADD COLUMN "visitorCompany" VARCHAR(255);
ALTER TABLE "HandoffTicket" ADD COLUMN "visitorLeftAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "VisitorMetadata" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "visitorId" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(128),
    "lastName" VARCHAR(128),
    "email" VARCHAR(255),
    "company" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_VisitorMetadata" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_VisitorMetadata_org_visitor" ON "VisitorMetadata"("organizationId", "visitorId");

-- CreateIndex
CREATE INDEX "IX_VisitorMetadata_organizationId" ON "VisitorMetadata"("organizationId");

-- AddForeignKey
ALTER TABLE "VisitorMetadata" ADD CONSTRAINT "VisitorMetadata_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
