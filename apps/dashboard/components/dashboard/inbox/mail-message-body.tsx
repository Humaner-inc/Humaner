'use client';

import * as React from 'react';

import {
  htmlToPlainText,
  isRichMailHtml,
  prepareMailHtmlForDisplay,
  stripLeadingSubjectFromText
} from '@/lib/inbox/mail-body-display';
import { cn } from '@/lib/utils';

/**
 * Client CSS for the sandboxed iframe. Tuned to match Gmail / Front / Superhuman:
 * clean canvas, intact table layouts, readable type, broken images hidden,
 * react-email preview dumps suppressed even if styles were stripped.
 */
const MAIL_IFRAME_CSS = `
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  background: #fff;
  color: #111;
  color-scheme: light;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  font-size: 14px;
  line-height: 1.55;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
body > div:first-child[style*="display:none"],
body > div:first-child[style*="display: none"],
body > div:first-child[style*="max-height:0"],
body > div:first-child[style*="max-height: 0"],
body > div:first-child[style*="opacity:0"],
body > div:first-child[style*="opacity: 0"],
[data-skip-in-text="true"],
.preheader,
.preview-text {
  display: none !important;
  max-height: 0 !important;
  max-width: 0 !important;
  overflow: hidden !important;
  opacity: 0 !important;
  visibility: hidden !important;
  font-size: 0 !important;
  line-height: 0 !important;
}
img, video, svg {
  max-width: 100%;
  height: auto;
  border: 0;
  outline: none;
  text-decoration: none;
  vertical-align: middle;
}
img.mail-broken {
  display: none !important;
}
a {
  color: #2563eb;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}
p {
  margin: 0 0 1em;
}
p:last-child {
  margin-bottom: 0;
}
h1, h2, h3, h4, h5, h6 {
  margin: 0 0 0.6em;
  line-height: 1.25;
  font-weight: 600;
  color: #111;
}
ul, ol {
  margin: 0 0 1em;
  padding-left: 1.4em;
}
blockquote {
  margin: 0 0 1em;
  padding-left: 12px;
  border-left: 3px solid #e5e5e5;
  color: #555;
}
hr {
  border: 0;
  border-top: 1px solid #eaeaea;
  margin: 20px 0;
}
table {
  border-collapse: collapse;
  border-spacing: 0;
}
table[width],
table[style*="width"] {
  max-width: 100% !important;
}
td, th {
  word-break: break-word;
}
a[style*="background"],
a[style*="background-color"],
a[bgcolor] {
  display: inline-block;
  box-sizing: border-box;
  text-decoration: none !important;
}
pre, code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}
pre {
  white-space: pre-wrap;
  overflow-x: auto;
  background: #f6f6f6;
  padding: 10px 12px;
  border-radius: 4px;
}
.gmail_quote,
.gmail_attr,
blockquote[type="cite"] {
  color: #666;
}
`.trim();

function buildMailSrcDoc(bodyHtml: string): string {
  // Script marks broken images so alt text ("X" / "XX") never paints.
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><base target="_blank" rel="noopener noreferrer"><style>${MAIL_IFRAME_CSS}</style></head><body>${bodyHtml}<script>(function(){function m(i){i.classList.add('mail-broken');i.removeAttribute('alt');i.style.display='none'}document.querySelectorAll('img').forEach(function(i){if(!i.getAttribute('referrerpolicy'))i.referrerPolicy='no-referrer-when-downgrade';if(i.complete&&i.naturalWidth===0&&i.src){m(i);return}i.addEventListener('error',function(){m(i)},{once:true})})})();</script></body></html>`;
}

export function MailMessageBody({
  bodyHtml,
  bodyText,
  subject,
  className
}: {
  bodyHtml: string | null;
  bodyText: string | null;
  /** Thread subject — stripped when restated as the first body line. */
  subject?: string | null;
  className?: string;
}): React.JSX.Element {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = React.useState(120);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : undefined;

  const html = React.useMemo(() => {
    const raw = bodyHtml?.trim() ? bodyHtml : null;
    if (!raw || !isRichMailHtml(raw)) return null;
    return prepareMailHtmlForDisplay(raw, subject, origin);
  }, [bodyHtml, subject, origin]);

  const text = React.useMemo(() => {
    const fromText = stripLeadingSubjectFromText(bodyText, subject);
    if (fromText?.trim()) return fromText;

    const rawHtml = bodyHtml?.trim();
    if (rawHtml && !isRichMailHtml(rawHtml)) {
      return stripLeadingSubjectFromText(htmlToPlainText(rawHtml), subject);
    }

    return fromText;
  }, [bodyHtml, bodyText, subject]);

  const srcDoc = html ? buildMailSrcDoc(html) : null;

  React.useEffect(() => {
    if (!srcDoc) return;

    const frame = iframeRef.current;
    if (!frame) return;

    let resizeObserver: ResizeObserver | null = null;
    const imageListeners: Array<{ img: HTMLImageElement; fn: () => void }> = [];
    let rafId = 0;

    const measure = (): void => {
      const doc = frame.contentDocument;
      if (!doc?.body) return;

      const bodyHeight = Math.max(
        doc.body.scrollHeight,
        doc.body.offsetHeight,
        doc.documentElement?.scrollHeight ?? 0,
        doc.documentElement?.offsetHeight ?? 0
      );
      const next = Math.ceil(Math.max(bodyHeight, 64));
      setHeight((prev) => (prev === next ? prev : next));
    };

    const scheduleMeasure = (): void => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measure);
    };

    const onLoad = (): void => {
      scheduleMeasure();
      window.setTimeout(scheduleMeasure, 120);
      window.setTimeout(scheduleMeasure, 480);

      const doc = frame.contentDocument;
      if (!doc?.body) return;

      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(() => {
        scheduleMeasure();
      });
      resizeObserver.observe(doc.body);
      if (doc.documentElement) {
        resizeObserver.observe(doc.documentElement);
      }

      for (const { img, fn } of imageListeners) {
        img.removeEventListener('load', fn);
        img.removeEventListener('error', fn);
      }
      imageListeners.length = 0;

      for (const img of doc.querySelectorAll('img')) {
        if (!img.getAttribute('referrerpolicy')) {
          img.referrerPolicy = 'no-referrer-when-downgrade';
        }
        if (img.complete) {
          scheduleMeasure();
          continue;
        }
        const fn = (): void => scheduleMeasure();
        img.addEventListener('load', fn);
        img.addEventListener('error', fn);
        imageListeners.push({ img, fn });
      }
    };

    frame.addEventListener('load', onLoad);
    frame.srcdoc = srcDoc;

    return () => {
      frame.removeEventListener('load', onLoad);
      resizeObserver?.disconnect();
      cancelAnimationFrame(rafId);
      for (const { img, fn } of imageListeners) {
        img.removeEventListener('load', fn);
        img.removeEventListener('error', fn);
      }
    };
  }, [srcDoc]);

  if (!srcDoc) {
    return (
      <div
        className={cn(
          'mt-3 whitespace-pre-wrap break-words text-[14px] leading-[1.55] text-foreground',
          className
        )}
      >
        {text || 'This message has no plain-text body.'}
      </div>
    );
  }

  return (
    <div
      className={cn(
        // No nested border — the email template brings its own chrome.
        'mt-3 overflow-x-auto overflow-y-hidden bg-white',
        className
      )}
    >
      <iframe
        ref={iframeRef}
        title="Email message"
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads allow-scripts"
        className="block w-full border-0 bg-white"
        style={{ height, minHeight: 64 }}
        scrolling="no"
      />
    </div>
  );
}
