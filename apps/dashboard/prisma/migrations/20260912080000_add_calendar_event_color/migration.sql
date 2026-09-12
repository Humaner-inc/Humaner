-- Personalized color for calendar events.
ALTER TABLE "CalendarEvent"
ADD COLUMN IF NOT EXISTS "color" VARCHAR(16) NOT NULL DEFAULT '#f85919';
