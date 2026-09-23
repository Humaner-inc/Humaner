import { parseCalendarWhen } from '@/lib/calendar/parse-calendar-when';

export type ExtractedMailMeeting = {
  title: string;
  startsAt: Date;
  endsAt: Date;
  sourceKey: string;
};

const EXPLICIT_CONFIRMATION =
  /\b(confirmed|confirmation|you(?:'re| are) booked|appointment confirmed|meeting confirmed|has been scheduled|is scheduled for|accepted your invitation|see you)\b/i;

const AGREEMENT =
  /\b(yes|yeah|yep|sure|perfect|sounds good|that works|works for me|works perfectly|i(?:'|’)ll be there|count me in)\b/i;

const WHEN_PHRASES = [
  /\b(?:tomorrow|today|tonight)\s+at\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?/i,
  /\b(?:tomorrow|today|tonight)\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)/i,
  /\b(?:this\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+at\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?/i,
  /\b(?:on\s+)?(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s+\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?(?:\s+\d{4})?(?:\s+at)?\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?/i,
  /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:,\s*\d{4})?(?:\s+at)?\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)/i,
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/
];

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12
};

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

function toPlain(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function replyPortion(body: string): string {
  const withoutQuote = body.split(/\bOn .{0,240}?wrote:/i)[0] ?? body;
  return withoutQuote.split(/original message/i)[0] ?? withoutQuote;
}

function meetingTitle(subject: string): string {
  const cleaned = subject
    .replace(/^(?:(?:re|fwd):\s*)+/i, '')
    .replace(/[?!.]+$/g, '')
    .replace(/\s+(?:tomorrow|today|tonight)$/i, '')
    .trim();
  return (cleaned || 'Confirmed meeting').slice(0, 255);
}

function findWhenPhrase(
  text: string
): { phrase: string; index: number } | null {
  let best: { phrase: string; index: number } | null = null;
  for (const pattern of WHEN_PHRASES) {
    const found = text.match(pattern);
    if (found?.[0] == null || found.index == null) continue;
    if (!best || found.index < best.index) {
      best = { phrase: found[0], index: found.index };
    }
  }
  return best;
}

function isSchedulingConfirmation(text: string, whenIndex: number): boolean {
  const around = text.slice(Math.max(0, whenIndex - 240), whenIndex + 80);
  if (EXPLICIT_CONFIRMATION.test(around)) {
    return true;
  }
  return AGREEMENT.test(
    text.slice(Math.max(0, whenIndex - 160), whenIndex + 48)
  );
}

function parseMonthPhrase(
  phrase: string,
  reference: Date,
  timeZone?: string | null
): Date | null {
  const match = phrase.match(
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})(?:,\s*(\d{4}))?(?:\s+at)?\s+(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i
  );
  if (!match) return null;
  const month = MONTHS[match[1].slice(0, 3).toLowerCase()];
  const day = Number(match[2]);
  const year = match[3] ? Number(match[3]) : reference.getFullYear();
  let hour = Number(match[4]);
  const minute = Number(match[5] ?? 0);
  const meridiem = match[6]?.replace(/\./g, '').toLowerCase();
  if (!month || day < 1 || day > 31 || hour > 24 || minute > 59) return null;
  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  if (hour === 24) hour = 0;
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  return parseCalendarWhen(iso, reference, timeZone);
}

function parseWhenPhrase(
  phrase: string,
  reference: Date,
  timeZone?: string | null
): Date | null {
  if (/^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(phrase)) {
    return parseMonthPhrase(phrase, reference, timeZone);
  }
  if (/\btonight\b/i.test(phrase)) {
    return parseCalendarWhen(
      phrase.replace(/\btonight\b/i, 'today'),
      reference,
      timeZone
    );
  }
  return parseCalendarWhen(phrase, reference, timeZone);
}

function extractHeuristicMeeting(
  subject: string,
  body: string,
  threadId: string,
  reference: Date,
  now: Date,
  timeZone?: string | null
): ExtractedMailMeeting | null {
  const text = replyPortion(`${subject}\n${body}`);
  const when = findWhenPhrase(text);
  if (!when || !isSchedulingConfirmation(text, when.index)) {
    return null;
  }

  const startsAt = parseWhenPhrase(when.phrase, reference, timeZone);
  if (!startsAt) return null;
  if (startsAt.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
    return null;
  }

  return {
    title: meetingTitle(subject),
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
  sentAt?: Date | null;
  timeZone?: string | null;
  now?: Date;
}): ExtractedMailMeeting[] {
  const rawBody = [input.bodyText, input.bodyHtml].filter(Boolean).join('\n');
  const fromIcs = extractIcsMeetings(
    `${input.subject}\n${rawBody}`,
    input.threadId
  );
  if (fromIcs.length > 0) {
    return fromIcs;
  }

  const now = input.now ?? new Date();
  const body = toPlain(rawBody);
  const heuristic = extractHeuristicMeeting(
    input.subject,
    body,
    input.threadId,
    input.sentAt ?? now,
    now,
    input.timeZone
  );
  return heuristic ? [heuristic] : [];
}
