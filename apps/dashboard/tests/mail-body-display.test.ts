import { describe, expect, it } from 'vitest';

import {
  htmlToPlainText,
  isRichMailHtml,
  isStructuredMailHtml,
  mailHtmlHasVisibleContent,
  prepareMailHtmlForDisplay
} from '@/lib/inbox/mail-body-display';

describe('isStructuredMailHtml', () => {
  it('detects paragraphs and lists without treating them as designed mail', () => {
    const html = `
      <p>Credits only draw down for usage they cover.</p>
      <h2>What they usually cover</h2>
      <ul>
        <li>Many grants cover Auto, Composer, and Grok.</li>
        <li>Some grants are model-restricted.</li>
      </ul>
    `;

    expect(isRichMailHtml(html)).toBe(false);
    expect(isStructuredMailHtml(html)).toBe(true);
  });

  it('leaves marketing tables to the iframe path', () => {
    const html = '<table><tr><td bgcolor="#ffffff">Welcome</td></tr></table>';
    expect(isRichMailHtml(html)).toBe(true);
    expect(isStructuredMailHtml(html)).toBe(false);
  });

  it('treats button CTAs as designed mail', () => {
    expect(isRichMailHtml('<button type="button">Open Kobbe</button>')).toBe(
      true
    );
  });
});

describe('prepareMailHtmlForDisplay', () => {
  it('keeps author CSS that hides a duplicate layout', () => {
    const html = `
      <style>.mail-dup{display:none}</style>
      <script>alert(1)</script>
      <table><tr><td>New login to Linear</td></tr></table>
    `;

    const prepared = prepareMailHtmlForDisplay(html, 'New login to Linear');

    expect(prepared).toContain('<style>');
    expect(prepared).toContain('mail-dup');
    expect(prepared).not.toMatch(/<script/i);
    expect(prepared).toContain('New login to Linear');
  });

  it('does not strip marketing bodies wrapped in overflow:hidden', () => {
    const html = `
      <section style="padding:32px 20px">
        <div style="overflow: hidden; max-width: 600px">
          <h1>Your 15-day Kobbe trial has started</h1>
          <p>Your 15 days start counting the moment Kobbe sees the first visit.</p>
          <a href="https://app.kobbe.io">Open Kobbe</a>
        </div>
      </section>
    `;

    const prepared = prepareMailHtmlForDisplay(
      html,
      'Your 15-day Kobbe trial has started'
    );

    expect(prepared).toContain('Open Kobbe');
    expect(prepared).toContain('first visit');
    expect(prepared).toContain('overflow: hidden');
  });

  it('still strips real preheader dumps', () => {
    const html = `
      <div style="display:none;max-height:0;overflow:hidden;opacity:0">
        Hidden preheader copy
      </div>
      <p>Visible body</p>
    `;

    const prepared = prepareMailHtmlForDisplay(html, null);

    expect(prepared).not.toContain('Hidden preheader copy');
    expect(prepared).toContain('Visible body');
  });
});

describe('mailHtmlHasVisibleContent', () => {
  it('rejects emptied marketing shells', () => {
    expect(
      mailHtmlHasVisibleContent('<section style="padding:32px 20px"></section>')
    ).toBe(false);
    expect(
      mailHtmlHasVisibleContent(
        '<table><tr><td>Welcome to Kobbe</td></tr></table>'
      )
    ).toBe(true);
  });
});

describe('htmlToPlainText', () => {
  it('keeps paragraph and list spacing', () => {
    const text = htmlToPlainText(`
      <p>Credits only draw down for usage they cover.</p>
      <h2>What they usually cover</h2>
      <ul>
        <li>Many grants cover Auto.</li>
        <li>Some grants are model-restricted.</li>
      </ul>
    `);

    expect(text).toContain('Credits only draw down');
    expect(text).toContain('• Many grants cover Auto.');
    expect(text).toMatch(/cover\.\s+What they usually cover/);
  });

  it('does not leak CSS from style tags', () => {
    const text = htmlToPlainText(`
      <style>body, .spm-email{ font:400 1rem / 1.5 "GB Proxima Nova" }</style>
      <p>Keep this sentence.</p>
    `);

    expect(text).toContain('Keep this sentence.');
    expect(text).not.toMatch(/spm-email|Proxima Nova/);
  });
});
