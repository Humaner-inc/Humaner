import { describe, expect, it } from 'vitest';

import { triageMailBody } from '@/lib/inbox/mail-exchange-split';

describe('triageMailBody', () => {
  it('keeps a single designed email intact', () => {
    const html =
      '<table><tr><td bgcolor="#ffffff">Welcome to Cursor</td></tr></table>';

    const result = triageMailBody(html, 'Welcome to Cursor');

    expect(result.previous).toHaveLength(0);
    expect(result.latest.html).toContain('Welcome to Cursor');
  });

  it('keeps HTML-only marketing mail when plain text is missing', () => {
    const html = `
      <table role="presentation">
        <tr><td>
          <img src="https://cdn.example.com/logo.png" alt="Kobbe" />
          <h1>Welcome to Kobbe</h1>
          <p>Add your first site and install the tracker.</p>
          <a href="https://app.kobbe.io">Open Kobbe</a>
        </td></tr>
      </table>
    `;

    const result = triageMailBody(html, null);

    expect(result.latest.html).toContain('Welcome to Kobbe');
    expect(result.latest.html).toContain('Open Kobbe');
    expect(result.previous).toHaveLength(0);
  });

  it('folds a Gmail quote under previous', () => {
    const html = `
      <div>Thanks — that clears it up.</div>
      <div class="gmail_quote">
        <div class="gmail_attr">On Fri, Sep 11, 2026 at 1:37 PM hi@cursor.com wrote:</div>
        <blockquote class="gmail_quote">
          Grants cover Auto, Composer, and Grok.
        </blockquote>
      </div>
    `;

    const result = triageMailBody(html, null);

    expect(result.latest.text).toContain('that clears it up');
    expect(result.previous.length).toBeGreaterThanOrEqual(1);
    expect(result.previous[0]?.text).toContain('Grants cover Auto');
  });

  it('strips Private Email chrome and shows the latest exchange', () => {
    const text = `Sent insecurely from Private Email
Replying to hi@cursor.com on September 11, 2026, 1:37 PM
From: hi@cursor.com
To: dev@humaner.io
Date: September 11, 2026, 1:37 PM
Subject: Re: [Cursor Help Form] Credits
What they usually cover
Many grants cover any eligible Cursor usage.
On Thu, Sep 10, 2026 at 4:02 PM Alex wrote:
Can you confirm whether Opus is included?
`;

    const result = triageMailBody(null, text);

    expect(result.latest.text).toContain('What they usually cover');
    expect(result.latest.text).not.toContain('Sent insecurely');
    expect(result.latest.text).not.toMatch(/^From: hi@cursor.com/);
    expect(result.previous.length).toBeGreaterThanOrEqual(1);
    expect(result.previous.some((item) => item.text?.includes('Opus'))).toBe(
      true
    );
  });

  it('splits Proton-style HTML around a blockquote', () => {
    const html = `
      <div>I'll keep using Composer for now.</div>
      <blockquote type="cite">
        <div>Replying to hi@cursor.com on September 11, 2026, 1:37 PM</div>
        <div>From: hi@cursor.com</div>
        <div>To: dev@humaner.io</div>
        <div>Opus and Fable both use the Other Models pool.</div>
      </blockquote>
    `;

    const result = triageMailBody(html, null);

    expect(result.latest.text).toContain('Composer');
    expect(result.previous[0]?.text).toContain('Other Models pool');
  });

  it('does not treat Proton style blocks as earlier messages', () => {
    const html = `
      <div>I'll keep using Composer for now.</div>
      <style type="text/css">
        body, .spm-email{ font:400 1rem / 1.5 "GB Proxima Nova", -apple-system }
      </style>
      <blockquote type="cite">
        <div>Opus and Fable both use the Other Models pool.</div>
      </blockquote>
    `;

    const result = triageMailBody(html, null);

    expect(result.latest.text).toContain('Composer');
    expect(
      result.previous.map((item) => item.text ?? '').join(' ')
    ).not.toMatch(/spm-email|Proxima Nova/);
    expect(result.previous[0]?.text).toContain('Other Models pool');
  });

  it('keeps a Linear-style card with From/To chrome as one message', () => {
    const html = `
      <style>.mail-dup{display:none!important}</style>
      <table width="100%">
        <tr>
          <td>
            From: security@updates.linear.app<br>
            To: you@humaner.io<br>
            New login to Linear
          </td>
        </tr>
      </table>
      <table class="mail-dup" width="100%">
        <tr>
          <td>
            From: security@updates.linear.app<br>
            To: you@humaner.io<br>
            New login to Linear
          </td>
        </tr>
      </table>
    `;

    const result = triageMailBody(html, null, 'New login to Linear');

    expect(result.previous).toHaveLength(0);
    expect(result.latest.html).toContain('<style>');
    expect(result.latest.html).toContain('mail-dup');
    expect(result.latest.text).toContain('New login to Linear');
  });

  it('promotes the quoted body when the reply itself is empty', () => {
    const text = `Sent insecurely from Private Email
From: hi@cursor.com
To: dev@humaner.io
Subject: Credits
Opus and Fable both use the Other Models pool.
`;

    const result = triageMailBody(null, text);

    expect(result.latest.text).toContain('Other Models pool');
    expect(result.previous).toHaveLength(0);
  });
});
