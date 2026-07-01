/**
 * Handoff ticket enums mirrored from `prisma/schema.prisma`.
 * Kept in-repo so client components do not depend on a freshly generated
 * `@prisma/client` (IDE TS can lag behind `prisma generate` on Windows).
 */
export const HandoffTicketStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
} as const;

export type HandoffTicketStatus =
  (typeof HandoffTicketStatus)[keyof typeof HandoffTicketStatus];

export const HandoffTicketUrgency = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
} as const;

export type HandoffTicketUrgency =
  (typeof HandoffTicketUrgency)[keyof typeof HandoffTicketUrgency];

export const HandoffTicketSource = {
  WIDGET: 'WIDGET',
  API: 'API'
} as const;

export type HandoffTicketSource =
  (typeof HandoffTicketSource)[keyof typeof HandoffTicketSource];
