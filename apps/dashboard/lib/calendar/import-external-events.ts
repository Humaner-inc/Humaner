import 'server-only';

/**
 * Self-Host calendar is in-app only. Google, Outlook, and Calendly catch-up
 * stays in the private module josh replaces with this file.
 */
export async function catchUpConnectedCalendarEvents(_input: {
  organizationId: string;
  createdById: string;
  timeMin?: Date;
  timeMax?: Date;
}): Promise<number> {
  return 0;
}
