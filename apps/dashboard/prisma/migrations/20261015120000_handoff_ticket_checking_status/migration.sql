-- Tasks: "Checking" status (work done, under review) between in progress and done.

ALTER TYPE "HandoffTicketStatus" ADD VALUE IF NOT EXISTS 'checking' AFTER 'inProgress';
