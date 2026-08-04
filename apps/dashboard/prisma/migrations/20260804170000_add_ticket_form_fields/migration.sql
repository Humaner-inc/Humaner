-- AlterTable: Organization — configurable ticket creation form fields
ALTER TABLE "Organization"
ADD COLUMN "ticketFormFields" JSONB;
