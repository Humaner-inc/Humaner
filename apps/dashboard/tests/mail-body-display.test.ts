import { describe, expect, it } from 'vitest';

import {
  htmlToPlainText,
  isRichMailHtml,
  isStructuredMailHtml
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
