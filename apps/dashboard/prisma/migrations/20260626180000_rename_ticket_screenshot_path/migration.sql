-- Store bucket-relative paths instead of public URLs
ALTER TABLE "SupportTicket" RENAME COLUMN "screenshotUrl" TO "screenshotPath";

UPDATE "SupportTicket"
SET "screenshotPath" = regexp_replace("screenshotPath", '^.*/Tickets/', '')
WHERE "screenshotPath" LIKE '%/Tickets/%';

DELETE FROM "SupportTicket" WHERE "screenshotPath" IS NULL;

ALTER TABLE "SupportTicket" ALTER COLUMN "screenshotPath" SET NOT NULL;
