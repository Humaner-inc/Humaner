import { extractMeetingsFromMail } from '@/services/calendar/extract-meetings-from-mail';
import { describe, expect, it } from 'vitest';

const sentAt = new Date('2026-09-23T21:03:00.000Z');

describe('extractMeetingsFromMail', () => {
  it('books a natural coffee confirmation for tomorrow at 4pm', () => {
    const [meeting] = extractMeetingsFromMail({
      threadId: 'thread-1',
      subject: 'Re: Coffee at La Havana tomorrow?',
      bodyText:
        'Hey Alexandre, Yes, that works perfectly! See you at La Havana tomorrow at 4pm. Looking forward to it.',
      sentAt,
      timeZone: 'Europe/Paris',
      now: sentAt
    });

    expect(meeting?.title).toBe('Coffee at La Havana');
    expect(meeting?.startsAt.toISOString()).toBe('2026-09-24T14:00:00.000Z');
    expect(meeting?.endsAt.toISOString()).toBe('2026-09-24T15:00:00.000Z');
    expect(meeting?.sourceKey).toBe('mail:thread-1:2026-09-24T14:00:00.000Z');
  });

  it('books an explicit confirmation on a calendar date', () => {
    const [meeting] = extractMeetingsFromMail({
      threadId: 'thread-2',
      subject: 'Re: Intro call',
      bodyText: 'You are booked. The call is confirmed for Sep 24 at 4pm.',
      sentAt,
      timeZone: 'Europe/Paris',
      now: sentAt
    });

    expect(meeting?.title).toBe('Intro call');
    expect(meeting?.startsAt.toISOString()).toBe('2026-09-24T14:00:00.000Z');
  });

  it('ignores a yes that never names a time', () => {
    expect(
      extractMeetingsFromMail({
        threadId: 'thread-3',
        subject: 'Re: Coffee at La Havana tomorrow?',
        bodyText: 'Yes, that works perfectly! Looking forward to it.',
        sentAt,
        timeZone: 'Europe/Paris',
        now: sentAt
      })
    ).toEqual([]);
  });

  it('ignores a time that is not a confirmation', () => {
    expect(
      extractMeetingsFromMail({
        threadId: 'thread-4',
        subject: 'Cafe hours',
        bodyText: 'The cafe closes tomorrow at 4pm.',
        sentAt,
        timeZone: 'Europe/Paris',
        now: sentAt
      })
    ).toEqual([]);
  });

  it('keeps an ics invite ahead of the heuristic', () => {
    const [meeting] = extractMeetingsFromMail({
      threadId: 'thread-5',
      subject: 'Invite',
      bodyText: `BEGIN:VEVENT
DTSTART:20260924T140000Z
DTEND:20260924T150000Z
SUMMARY:Coffee
END:VEVENT`,
      sentAt,
      now: sentAt
    });

    expect(meeting?.title).toBe('Coffee');
    expect(meeting?.startsAt.toISOString()).toBe('2026-09-24T14:00:00.000Z');
  });
});
