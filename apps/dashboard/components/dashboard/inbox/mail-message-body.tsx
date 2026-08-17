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
const MAIL_CANVAS_LIGHT = '#fcf4ec';
const MAIL_CANVAS_DARK = '#0A0D0D';
const MAIL_SANDBOX =
  'allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads';

/**
 * Minimal iframe CSS — do NOT restyle sender HTML (borders, margins, type).
 * Canvas color adapts so white bordered cards stay visible in both themes.
 * No scripts in the mail document — hide broken images from the parent.
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
body > table,
body > div > table {
  background-color: #ffffff;
}
body > :first-child[style*="display:none"],
body > :first-child[style*="display: none"],
body > :first-child[style*="max-height:0"],
body > :first-child[style*="max-height: 0"],
body > :first-child[style*="opacity:0"],
body > :first-child[style*="opacity: 0"],
body > :first-child[style*="visibility:hidden"],
body > :first-child[style*="visibility: hidden"],
#__react-email-preview,
[data-skip-in-text="true"],
.preheader,
.preview-text,
.previewtext,
.mcnPreviewText {
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
img.mail-broken,
img:not([src]),
img[src=""] {
  display: none !important;
}
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
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><meta http-equiv="Content-Security-Policy" content="script-src 'none'; object-src 'none';"><base target="_blank" rel="noopener noreferrer"><style>${mailIframeCss(canvas)}</style></head><body>${bodyHtml}</body></html>`;
}

function hideBrokenImage(img: HTMLImageElement): void {
  img.classList.add('mail-broken');
  img.removeAttribute('alt');
  img.style.display = 'none';
}

const PREVIEW_CLASS_RE = /preheader|preview-text|previewtext|mcnpreviewtext/i;
const PREVIEW_STYLE_RE =
  /display\s*:\s*none|max-height\s*:\s*0|opacity\s*:\s*0|visibility\s*:\s*hidden|mso-hide/i;

/** Drop leaked inbox-preview text that ESPs hide with CSS Gmail honors. */
function stripLeakedPreheader(body: HTMLElement): void {
  while (body.firstChild?.nodeType === Node.TEXT_NODE) {
    const text = body.firstChild.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    if (text.length === 0) {
      body.removeChild(body.firstChild);
      continue;
    }
    if (text.length <= 80) {
      body.removeChild(body.firstChild);
      continue;
    }
    break;
  }

  const first = body.firstElementChild;
  if (!first) return;
  const style = first.getAttribute('style') ?? '';
  const className = typeof first.className === 'string' ? first.className : '';
  if (
    first.id === '__react-email-preview' ||
    PREVIEW_CLASS_RE.test(className) ||
    PREVIEW_STYLE_RE.test(style)
  ) {
    first.remove();
  }
}

export function MailMessageBody({
  bodyHtml,
  bodyText,
  subject,
  className,
  eager = false
}: {
  bodyHtml: string | null;
  bodyText: string | null;
  /** Thread subject — stripped when restated as the first body line. */
  subject?: string | null;
  className?: string;
  /** Mount the iframe immediately (latest messages). Older ones wait until near view. */
  eager?: boolean;
}): React.JSX.Element {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState(120);
  const [active, setActive] = React.useState(eager);
  const { resolvedTheme } = useTheme();
  const canvas =
    resolvedTheme === 'dark' ? MAIL_CANVAS_DARK : MAIL_CANVAS_LIGHT;

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
    if (active || !srcDoc) return;
    const el = hostRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setActive(true);
        observer.disconnect();
      },
      { rootMargin: '240px 0px', threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [active, srcDoc]);

  React.useEffect(() => {
    if (!srcDoc || !active) return;

    const frame = iframeRef.current;
    if (!frame) return;

    let resizeObserver: ResizeObserver | null = null;
    const imageListeners: Array<{
      img: HTMLImageElement;
      onLoad: () => void;
      onError: () => void;
    }> = [];
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

    const onFrameLoad = (): void => {
      scheduleMeasure();

      const doc = frame.contentDocument;
      if (!doc?.body) return;

      stripLeakedPreheader(doc.body);

      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(() => {
        scheduleMeasure();
      });
      resizeObserver.observe(doc.body);
      if (doc.documentElement) {
        resizeObserver.observe(doc.documentElement);
      }

      for (const { img, onLoad, onError } of imageListeners) {
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
      }
      imageListeners.length = 0;

      for (const img of doc.querySelectorAll('img')) {
        if (!img.getAttribute('referrerpolicy')) {
          img.referrerPolicy = 'no-referrer';
        }
        img.decoding = 'async';
        if (!eager && !img.getAttribute('loading')) {
          img.loading = 'lazy';
        }

        const onError = (): void => {
          hideBrokenImage(img);
          scheduleMeasure();
        };
        const onLoad = (): void => {
          if (img.naturalWidth === 0 && img.src) {
            hideBrokenImage(img);
          }
          scheduleMeasure();
        };

        if (img.complete) {
          onLoad();
          continue;
        }
        img.addEventListener('load', onLoad);
        img.addEventListener('error', onError);
        imageListeners.push({ img, onLoad, onError });
      }
    };

    frame.addEventListener('load', onFrameLoad);
    if (frame.contentDocument?.readyState === 'complete') {
      onFrameLoad();
    }

    return () => {
      frame.removeEventListener('load', onFrameLoad);
      resizeObserver?.disconnect();
      cancelAnimationFrame(rafId);
      for (const { img, onLoad, onError } of imageListeners) {
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
      }
    };
  }, [srcDoc, active, eager]);

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

  if (!active) {
    return (
      <div
        ref={hostRef}
        className={cn('overflow-x-auto', className)}
        style={{ backgroundColor: canvas, minHeight: 120 }}
        aria-hidden
      />
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
        srcDoc={srcDoc}
        sandbox={MAIL_SANDBOX}
        referrerPolicy="no-referrer"
        className="block w-full border-0"
        style={{ height, minHeight: 64, backgroundColor: canvas }}
        scrolling="no"
        suppressHydrationWarning
      />
    </div>
  );
}
