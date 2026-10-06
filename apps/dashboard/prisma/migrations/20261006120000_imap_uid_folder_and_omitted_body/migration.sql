-- IMAP UID + folder scope, oversized-body marker, and attachment parts left on the server.

ALTER TABLE "MailMessage" ADD COLUMN "imapUid" INTEGER;
ALTER TABLE "MailMessage" ADD COLUMN "imapFolderPath" VARCHAR(512);
ALTER TABLE "MailMessage" ADD COLUMN "bodyOmitted" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "IX_MailMessage_imap_folder_uid" ON "MailMessage"("imapFolderPath", "imapUid");

ALTER TABLE "MailMessageAttachment" ADD COLUMN "imapPartId" VARCHAR(255);
ALTER TABLE "MailMessageAttachment" ALTER COLUMN "storageKey" DROP NOT NULL;
