import { describe, expect, it } from 'vitest';

import {
  resolveStoredMailBodies,
  sanitizeMailHtml
} from '@/lib/inbox/sanitize-mail-html';

describe('sanitizeMailHtml', () => {
  it('returns null for empty input', () => {
    expect(sanitizeMailHtml(null)).toBeNull();
    expect(sanitizeMailHtml(undefined)).toBeNull();
    expect(sanitizeMailHtml('')).toBeNull();
    expect(sanitizeMailHtml(false)).toBeNull();
  });

  it('keeps marketing tables, styles, and links', () => {
    const html = `
      <style>.hero{color:#111}</style>
      <table width="100%"><tr><td bgcolor="#ffffff">Welcome to Humaner</td></tr></table>
      <a href="https://humaner.io/docs">Docs</a>
    `;

    const sanitized = sanitizeMailHtml(html);

    expect(sanitized).toContain('<style>');
    expect(sanitized).toContain('Welcome to Humaner');
    expect(sanitized).toContain('href="https://humaner.io/docs"');
    expect(sanitized).toContain('rel="noopener noreferrer"');
    expect(sanitized).toContain('target="_blank"');
  });

  it('strips scripts, event handlers, and javascript URLs', () => {
    const html = `
      <p onclick="alert(1)">Invoice attached</p>
      <script>alert(1)</script>
      <a href="javascript:alert(1)">Click</a>
      <img src="https://cdn.example.com/logo.png" onerror="alert(1)" alt="Logo" />
    `;

    const sanitized = sanitizeMailHtml(html);

    expect(sanitized).toContain('Invoice attached');
    expect(sanitized).not.toMatch(/<script/i);
    expect(sanitized).not.toMatch(/onclick/i);
    expect(sanitized).not.toMatch(/onerror/i);
    expect(sanitized).not.toMatch(/javascript:/i);
    expect(sanitized).toContain('https://cdn.example.com/logo.png');
  });

  it('rewrites protocol-relative image URLs to https', () => {
    const sanitized = sanitizeMailHtml(
      '<img src="//cdn.example.com/banner.png" alt="Banner" />'
    );

    expect(sanitized).toContain('src="https://cdn.example.com/banner.png"');
  });
});

describe('resolveStoredMailBodies', () => {
  it('derives plain text when the sender omitted text/plain', () => {
    const html = `
      <table><tr><td>
        <h1>Welcome to Kobbe</h1>
        <p>Add your first site and install the tracker.</p>
        <a href="https://app.kobbe.io">Open Kobbe</a>
      </td></tr></table>
    `;

    const bodies = resolveStoredMailBodies({ html, text: null });

    expect(bodies.bodyHtml).toContain('Welcome to Kobbe');
    expect(bodies.bodyText).toContain('Welcome to Kobbe');
    expect(bodies.bodyText).toContain('Add your first site');
  });

  it('keeps authored plain text when both parts exist', () => {
    const bodies = resolveStoredMailBodies({
      html: '<p>HTML version</p>',
      text: 'Plain version'
    });

    expect(bodies.bodyText).toBe('Plain version');
    expect(bodies.bodyHtml).toContain('HTML version');
  });

  it('drops hollow HTML shells and keeps plain text', () => {
    const bodies = resolveStoredMailBodies({
      html: '<section style="padding:32px 20px"></section>',
      text: 'Your 15-day Kobbe trial has started\n\nYour 15 days start counting.'
    });

    expect(bodies.bodyHtml).toBeNull();
    expect(bodies.bodyText).toContain('15 days start counting');
  });

  it('keeps marketing HTML wrapped in overflow:hidden', () => {
    const html = `
      <section style="padding:32px 20px">
        <div style="overflow: hidden; max-width: 600px">
          <h1>Welcome to Kobbe</h1>
          <p>Add your first site and install the tracker.</p>
        </div>
      </section>
    `;

    const bodies = resolveStoredMailBodies({ html, text: null });

    expect(bodies.bodyHtml).toContain('Welcome to Kobbe');
    expect(bodies.bodyHtml).toContain('overflow: hidden');
    expect(bodies.bodyText).toContain('Welcome to Kobbe');
  });
});
