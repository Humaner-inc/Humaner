import 'server-only';

/** In-app events are not mirrored to Google on Self-Host. */
export function shouldSyncSourceKeyToGoogle(
  _sourceKey: string | null | undefined
): boolean {
  return false;
}

export async function pushCalendarEventToGoogle(_input: {
  organizationId: string;
  title: string;
  description?: string | null;
  startsAt: Date;
  endsAt: Date;
  allDay?: boolean;
  sourceKey?: string | null;
  timeZone?: string | null;
}): Promise<string | null> {
  return null;
}

export async function deleteCalendarEventFromGoogle(_input: {
  organizationId: string;
  sourceKey?: string | null;
}): Promise<void> {
  // In-app events are not mirrored to Google on Self-Host.
}
