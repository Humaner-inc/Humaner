CREATE TABLE "Contact" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "company" VARCHAR(128),
    "notes" TEXT,
    "image" VARCHAR(2048),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_Contact" PRIMARY KEY ("id")
);

CREATE TABLE "ContactImage" (
    "id" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "data" BYTEA NOT NULL,
    "contentType" VARCHAR(255) NOT NULL,
    "hash" VARCHAR(64),

    CONSTRAINT "PK_ContactImage" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UQ_Contact_user_email" ON "Contact"("userId", "email");

CREATE INDEX "IX_Contact_userId_name" ON "Contact"("userId", "name");

CREATE UNIQUE INDEX "UQ_ContactImage_contactId" ON "ContactImage"("contactId");

ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContactImage" ADD CONSTRAINT "ContactImage_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
