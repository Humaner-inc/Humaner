-- When Polar reports past_due / unpaid on Inbox, full access lasts 7 days from this stamp.
ALTER TABLE "User" ADD COLUMN "billingGraceStartedAt" TIMESTAMP(3);
