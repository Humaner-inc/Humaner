-- CreateEnum
CREATE TYPE "WorkspaceJoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "WorkspaceJoinRequest" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "status" "WorkspaceJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_WorkspaceJoinRequest" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IX_WorkspaceJoinRequest_organizationId_status" ON "WorkspaceJoinRequest"("organizationId", "status");

-- CreateIndex
CREATE INDEX "IX_WorkspaceJoinRequest_userId" ON "WorkspaceJoinRequest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_WorkspaceJoinRequest_user_org" ON "WorkspaceJoinRequest"("userId", "organizationId");

-- AddForeignKey
ALTER TABLE "WorkspaceJoinRequest" ADD CONSTRAINT "WorkspaceJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceJoinRequest" ADD CONSTRAINT "WorkspaceJoinRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
