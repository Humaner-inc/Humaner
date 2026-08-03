/** Format an org-scoped ticket number as a human-readable reference. */
export function formatTicketRef(ticketNumber: number): string {
  return `#${String(ticketNumber).padStart(5, '0')}`;
}

/** Parse a ticket ref like "#00042" or "42" into a number, or null if invalid. */
export function parseTicketRef(value: string): number | null {
  const trimmed = value.trim().replace(/^#/, '');
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
