-- Prepaid credits wallet. New Humaner owners get $20 (2000 cents) in-app —
-- no Polar product, card, or trial. Existing Polar volume subscribers stay
-- on billingModel = 'subscription' with a zero balance.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "creditBalanceCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingModel" VARCHAR(32) NOT NULL DEFAULT 'subscription';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "starterCreditGrantedAt" TIMESTAMP(3);

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "creditBalanceCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "billingModel" VARCHAR(32) NOT NULL DEFAULT 'subscription';
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "starterCreditGrantedAt" TIMESTAMP(3);
