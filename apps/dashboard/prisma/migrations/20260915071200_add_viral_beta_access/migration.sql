-- Viral beta: one-time share codes, Inbox window, and X-follow credit flag.
ALTER TABLE "User" ADD COLUMN "viralBetaExpiresAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "xFollowCreditGrantedAt" TIMESTAMP(3);

CREATE TABLE "ViralBetaAccessCode" (
    "id" UUID NOT NULL,
    "code" VARCHAR(11) NOT NULL,
    "issuedByOwnerId" UUID NOT NULL,
    "redeemedByOwnerId" UUID,
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_ViralBetaAccessCode" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UQ_ViralBetaAccessCode_code" ON "ViralBetaAccessCode"("code");
CREATE INDEX "IX_ViralBetaAccessCode_issuedByOwnerId" ON "ViralBetaAccessCode"("issuedByOwnerId");
CREATE INDEX "IX_ViralBetaAccessCode_redeemedByOwnerId" ON "ViralBetaAccessCode"("redeemedByOwnerId");

ALTER TABLE "ViralBetaAccessCode" ADD CONSTRAINT "ViralBetaAccessCode_issuedByOwnerId_fkey" FOREIGN KEY ("issuedByOwnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ViralBetaAccessCode" ADD CONSTRAINT "ViralBetaAccessCode_redeemedByOwnerId_fkey" FOREIGN KEY ("redeemedByOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
