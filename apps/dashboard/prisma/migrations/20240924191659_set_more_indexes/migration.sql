-- CreateIndex
CREATE INDEX "IX_Account_userId" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "IX_ApiKey_organizationId" ON "ApiKey"("organizationId");

-- CreateIndex
CREATE INDEX "IX_Organization_stripeCustomerId" ON "Organization"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "IX_ResetPasswordRequest_email" ON "ResetPasswordRequest"("email");

-- CreateIndex
CREATE INDEX "IX_Session_userId" ON "Session"("userId");
