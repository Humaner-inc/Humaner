CREATE TABLE IF NOT EXISTS "CalendarEvent" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_CalendarEvent" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IX_CalendarEvent_organizationId_startsAt" ON "CalendarEvent"("organizationId", "startsAt");
CREATE INDEX IF NOT EXISTS "IX_CalendarEvent_createdById" ON "CalendarEvent"("createdById");

ALTER TABLE "CalendarEvent"
  ADD CONSTRAINT "CalendarEvent_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CalendarEvent"
  ADD CONSTRAINT "CalendarEvent_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "CalendarEventAttendee" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "PK_CalendarEventAttendee" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_CalendarEventAttendee_event_user" ON "CalendarEventAttendee"("eventId", "userId");
CREATE INDEX IF NOT EXISTS "IX_CalendarEventAttendee_userId" ON "CalendarEventAttendee"("userId");

ALTER TABLE "CalendarEventAttendee"
  ADD CONSTRAINT "CalendarEventAttendee_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CalendarEventAttendee"
  ADD CONSTRAINT "CalendarEventAttendee_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
