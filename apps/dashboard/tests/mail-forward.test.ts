import { describe, expect, it } from 'vitest';

import {
  buildForwardBody,
  buildForwardSubject
} from '@/lib/inbox/mail-forward';

describe('buildForwardSubject', () => {
  it('prefixes Fwd once', () => {
    expect(buildForwardSubject('Credits')).toBe('Fwd: Credits');
    expect(buildForwardSubject('Re: Credits')).toBe('Fwd: Credits');
    expect(buildForwardSubject('Fwd: Credits')).toBe('Fwd: Credits');
  });
});

describe('buildForwardBody', () => {
  it('quotes the original message', () => {
    const body = buildForwardBody({
      fromAddress: 'hi@cursor.com',
      sentAt: '2026-09-11T13:37:00.000Z',
      subject: 'Credits',
      bodyHtml: '<style>body{font:16px}</style><p>Opus is in the pool.</p>',
      bodyText: null
    });

    expect(body).toContain('Forwarded message');
    expect(body).toContain('From: hi@cursor.com');
    expect(body).toContain('Opus is in the pool.');
    expect(body).not.toMatch(/body\{font/);
  });
});
