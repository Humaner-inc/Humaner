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

  it('quotes the HTML the reading pane shows, not the text/plain twin', () => {
    const body = buildForwardBody({
      fromAddress: 'epood@miterassa.ee',
      sentAt: '2026-10-05T12:00:00.000Z',
      subject: 'Tartus Ehitus',
      bodyHtml:
        '<table><tr><td><h2>AUDIO- JA VIDEOTEHNOLOOGIAT</h2><p>9.-11. oktoobril oleme Tartus.</p></td></tr></table>',
      bodyText: [
        'AUDIO- JA VIDEOTEHNOLOOGIAT',
        '***',
        '',
        '***',
        '9.-11. oktoobril oleme Tartus.'
      ].join('\n')
    });

    expect(body).toContain('9.-11. oktoobril oleme Tartus.');
    expect(body).not.toMatch(/^\*{3}$/m);
    expect(body).toContain('From: epood@miterassa.ee');
  });
});
