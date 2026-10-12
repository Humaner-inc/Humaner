-- Outbound waves: waiting list released after a delay when the mailbox cap is reached.

ALTER TABLE "OutboundWave"
  ADD COLUMN "waitingDelayMinutes" INTEGER,
  ADD COLUMN "waitingReleaseAt" TIMESTAMP(3),
  ADD COLUMN "capResetAt" TIMESTAMP(3);
