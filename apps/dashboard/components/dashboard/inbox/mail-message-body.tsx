'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';

import {
  htmlToPlainText,
  isRichMailHtml,
  prepareMailHtmlForDisplay,
  stripLeadingSubjectFromText
} from '@/lib/inbox/mail-body-display';
import { cn } from '@/lib/utils';

/** Same as page background — one surface behind the email card. */
const MAIL_CANVAS_LIGHT = '#fff8f2';
const MAIL_CANVAS_DARK = '#0A0D0D';

/**
 * Minimal iframe CSS — do NOT restyle sender HTML (borders, margins, type).
 * Canvas color adapts so white bordered cards stay visible in both themes.
 */
function mailIframeCss(canvas: string): string {
  return `
html {
  margin: 0;
  padding: 0;
  background: ${canvas};
  color-scheme: light;
}
body {
  margin: 0;
  /* Room so card borders / outer margins aren't clipped at the iframe edge */
  padding: 20px 12px;
  width: 100%;
  box-sizing: border-box;
  background: ${canvas};
  color: #0A0D0D;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  font-size: 14px;
  line-height: 1.55;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
/*
 * sanitize-html drops the author <body>, which often carried bg-white.
 * React-email Containers are tables — restore their card fill so borders read.
 */
body > table,
body > div > table {
  background-color: #ffffff;
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
}
img.mail-broken {
  display: none !important;
}
/* Soften huge fixed-width tables without killing card borders/margins */
table {
  max-width: 100%;
}
td, th {
  word-break: break-word;
}
.gmail_quote,
.gmail_attr,
blockquote[type="cite"] {
  color: #18181b;
}
`.trim();
}

function buildMailSrcDoc(bodyHtml: string, canvas: string): string {
  // Script marks broken images so alt text ("X" / "XX") never paints.
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><base target="_blank" rel="noopener noreferrer"><style>${mailIframeCss(canvas)}</style></head><body>${bodyHtml}<script>(function(){function m(i){i.classList.add('mail-broken');i.removeAttribute('alt');i.style.display='none'}document.querySelectorAll('img').forEach(function(i){if(!i.getAttribute('referrerpolicy'))i.referrerPolicy='no-referrer-when-downgrade';if(i.complete&&i.naturalWidth===0&&i.src){m(i);return}i.addEventListener('error',function(){m(i)},{once:true})})})();</script></body></html>`;
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const canvas =
    mounted && resolvedTheme === 'dark' ? MAIL_CANVAS_DARK : MAIL_CANVAS_LIGHT;

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

  const srcDoc = html ? buildMailSrcDoc(html, canvas) : null;

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
      className={cn('overflow-x-auto', className)}
      style={{ backgroundColor: canvas }}
    >
      <iframe
        ref={iframeRef}
        title="Email message"
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads allow-scripts"
        className="block w-full border-0"
        style={{ height, minHeight: 64, backgroundColor: canvas }}
        scrolling="no"
      />
    </div>
  );
}
