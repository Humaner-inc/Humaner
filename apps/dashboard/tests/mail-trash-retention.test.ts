import { describe, expect, it } from 'vitest';

import {
  DEFAULT_MAIL_TRASH_RETENTION,
  mailTrashRetentionDays,
  parseMailTrashRetention
} from '@/lib/inbox/mail-trash-retention';

describe('mail trash retention', () => {
  it('maps each interval to days', () => {
    expect(mailTrashRetentionDays('WEEK')).toBe(7);
    expect(mailTrashRetentionDays('MONTH')).toBe(30);
    expect(mailTrashRetentionDays('THREE_MONTHS')).toBe(90);
  });

  it('parses postgres enum values and falls back to 3 months', () => {
    expect(parseMailTrashRetention('week')).toBe('WEEK');
    expect(parseMailTrashRetention('month')).toBe('MONTH');
    expect(parseMailTrashRetention('three_months')).toBe('THREE_MONTHS');
    expect(parseMailTrashRetention('THREE_MONTHS')).toBe('THREE_MONTHS');
    expect(parseMailTrashRetention('nope')).toBe(DEFAULT_MAIL_TRASH_RETENTION);
    expect(parseMailTrashRetention(undefined)).toBe(
      DEFAULT_MAIL_TRASH_RETENTION
    );
  });
});
