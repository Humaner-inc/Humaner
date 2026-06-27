-- Optional consent for using workspace data to improve Humaner agents (GDPR opt-in).

ALTER TABLE "Organization"
  ADD COLUMN "dataImprovementConsent" BOOLEAN,
  ADD COLUMN "dataImprovementConsentAt" TIMESTAMP(3),
  ADD COLUMN "dataImprovementConsentById" UUID;
