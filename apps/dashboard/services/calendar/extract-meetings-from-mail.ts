export type ExtractedMailMeeting = {
  title: string;
  startsAt: Date;
  endsAt: Date;
  sourceKey: string;
};

const CONFIRMATION =
  /\b(confirmed|confirmation|you(?:'re| are) booked|appointment confirmed|meeting confirmed|has been scheduled|is scheduled for|looking forward to (?:our|the) (?:call|meeting|appointment)|accepted your invitation)\b/i;

const ICS_EVENT = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/gi;

function parseIcsDate(value: string | undefined): Date | null {
  if (!value) return null;
  const compact = value.trim();
  const match = compact.match(
    /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?(Z)?$/
  );
  if (!match) {
    const parsed = new Date(compact);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const [, year, month, day, hour, minute, second, utc] = match;
  if (utc) {
    return new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour ?? '0'),
        Number(minute ?? '0'),
        Number(second ?? '0')
      )
    );
  }
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour ?? '9'),
    Number(minute ?? '0'),
    Number(second ?? '0')
  );
}

function icsField(block: string, name: string): string | undefined {
  const line = block
    .split(/\r?\n/)
    .find((row) => row.startsWith(`${name}:`) || row.startsWith(`${name};`));
  if (!line) return undefined;
  const separator = line.indexOf(':');
  return separator >= 0 ? line.slice(separator + 1).trim() : undefined;
}

function extractIcsMeetings(
  text: string,
  threadId: string
): ExtractedMailMeeting[] {
  const meetings: ExtractedMailMeeting[] = [];
  for (const match of text.matchAll(ICS_EVENT)) {
    const block = match[1] ?? '';
    const startsAt = parseIcsDate(icsField(block, 'DTSTART'));
    const endsAt =
      parseIcsDate(icsField(block, 'DTEND')) ??
      (startsAt ? new Date(startsAt.getTime() + 60 * 60 * 1000) : null);
    if (!startsAt || !endsAt || endsAt <= startsAt) continue;
    const title = (icsField(block, 'SUMMARY') ?? 'Meeting').slice(0, 255);
    meetings.push({
      title,
      startsAt,
      endsAt,
      sourceKey: `mail:${threadId}:${startsAt.toISOString()}`
    });
  }
  return meetings;
}

function extractHeuristicMeeting(
  subject: string,
  body: string,
  threadId: string
): ExtractedMailMeeting | null {
  if (!CONFIRMATION.test(`${subject}\n${body}`)) {
    return null;
  }

  const patterns = [
    /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:?\d{2})?)/,
    /\b(?:on\s+)?(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s+\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?(?:\s+\d{4})?(?:\s+at)?\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/i,
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:,\s*\d{4})?(?:\s+at)?\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)/i
  ];

  let startsAt: Date | null = null;
  for (const pattern of patterns) {
    const found = body.match(pattern) ?? subject.match(pattern);
    if (!found?.[0]) continue;
    const parsed = new Date(found[0]);
    if (!Number.isNaN(parsed.getTime())) {
      startsAt = parsed;
      break;
    }
  }

  if (!startsAt) return null;
  if (startsAt.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
    return null;
  }

  const title = subject
    .replace(/^(re|fwd):\s*/i, '')
    .trim()
    .slice(0, 255);
  return {
    title: title || 'Confirmed meeting',
    startsAt,
    endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000),
    sourceKey: `mail:${threadId}:${startsAt.toISOString()}`
  };
}

export function extractMeetingsFromMail(input: {
  threadId: string;
  subject: string;
  bodyText?: string | null;
  bodyHtml?: string | null;
}): ExtractedMailMeeting[] {
  const body = [input.bodyText, input.bodyHtml].filter(Boolean).join('\n');
  const fromIcs = extractIcsMeetings(
    `${input.subject}\n${body}`,
    input.threadId
  );
  if (fromIcs.length > 0) {
    return fromIcs;
  }

  const heuristic = extractHeuristicMeeting(
    input.subject,
    body,
    input.threadId
  );
  return heuristic ? [heuristic] : [];
}
