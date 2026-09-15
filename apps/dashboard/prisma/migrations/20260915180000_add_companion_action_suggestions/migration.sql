-- Workspace toggle: Companion starter and follow-up action chips.
ALTER TABLE "Organization"
ADD COLUMN IF NOT EXISTS "companionActionSuggestions" BOOLEAN NOT NULL DEFAULT true;
