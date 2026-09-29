'use client';

import * as React from 'react';
import { ChevronDownIcon } from '@humaner/shared/icons';
import { useTheme } from 'next-themes';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  htmlToPlainText,
  isRichMailHtml,
  isStructuredMailHtml,
  prepareMailHtmlForDisplay,
  stripLeadingSubjectFromText
} from '@/lib/inbox/mail-body-display';
import {
  triageMailBody,
  type MailExchange
} from '@/lib/inbox/mail-exchange-split';
import { structuredMailNodes } from '@/lib/inbox/structured-mail-html';
import { cn } from '@/lib/utils';

const MAIL_SANDBOX =
  'allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads';

/**
 * Minimal iframe CSS — do NOT restyle sender HTML (borders, margins, type).
 * Canvas stays transparent so the message sits on the same card as plain mail.
 * Dark theme inverts authored content only; images are double-inverted.
 */
function mailIframeCss(invert: boolean): string {
  const invertRules = invert
    ? `
body > * {
  filter: invert(1) hue-rotate(180deg);
}
body > * img,
body > * video,
body > * picture,
body > * canvas,
body > * [style*="background-image"] {
  filter: invert(1) hue-rotate(180deg);
}
`
    : '';

  return `
html {
  margin: 0;
  padding: 0;
  background: transparent;
  color-scheme: ${invert ? 'dark' : 'light'};
}
${invertRules}
body {
  margin: 0;
  padding: 4px 0;
  width: 100%;
  box-sizing: border-box;
  background: transparent;
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

function buildMailSrcDoc(bodyHtml: string, invert: boolean): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="${invert ? 'dark' : 'light'}"><meta http-equiv="Content-Security-Policy" content="script-src 'none'; object-src 'none';"><base target="_blank" rel="noopener noreferrer"><style>${mailIframeCss(invert)}</style></head><body>${bodyHtml}</body></html>`;
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

function MailPlainBody({
  text,
  className
}: {
  text: string;
  className?: string;
}): React.JSX.Element {
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

function MailStructuredBody({
  html,
  className
}: {
  html: string;
  className?: string;
}): React.JSX.Element {
  const [nodes, setNodes] = React.useState<React.ReactNode>(null);

  React.useEffect(() => {
    setNodes(structuredMailNodes(html));
  }, [html]);

  if (!nodes) {
    return (
      <MailPlainBody
        text={htmlToPlainText(html)}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        'mail-structured-body mt-3 break-words text-[14px] leading-[1.55] text-foreground [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5',
        className
      )}
    >
      {nodes}
    </div>
  );
}

function MailHtmlFrame({
  html,
  invert,
  eager,
  className
}: {
  html: string;
  invert: boolean;
  eager: boolean;
  className?: string;
}): React.JSX.Element {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState(120);
  const [active, setActive] = React.useState(eager);
  const srcDoc = buildMailSrcDoc(html, invert);

  React.useEffect(() => {
    if (active) return;
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
  }, [active]);

  React.useEffect(() => {
    if (!active) return;

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

  if (!active) {
    return (
      <div
        ref={hostRef}
        className={cn('overflow-x-auto', className)}
        style={{ backgroundColor: 'transparent', minHeight: 120 }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn('overflow-x-auto', className)}
      style={{ backgroundColor: 'transparent' }}
    >
      <iframe
        ref={iframeRef}
        title="Email message"
        srcDoc={srcDoc}
        sandbox={MAIL_SANDBOX}
        referrerPolicy="no-referrer"
        className="block w-full border-0 bg-transparent"
        style={{ height, minHeight: 64, backgroundColor: 'transparent' }}
        scrolling="no"
        suppressHydrationWarning
      />
    </div>
  );
}

function MailExchangeView({
  exchange,
  subject,
  origin,
  invert,
  eager,
  className
}: {
  exchange: MailExchange;
  subject?: string | null;
  origin?: string;
  invert: boolean;
  eager: boolean;
  className?: string;
}): React.JSX.Element {
  const rawHtml = exchange.html?.trim() || null;
  const preparedHtml = React.useMemo(() => {
    if (!rawHtml) return null;
    return prepareMailHtmlForDisplay(rawHtml, subject, origin);
  }, [origin, rawHtml, subject]);

  const text = React.useMemo(() => {
    if (rawHtml && !isRichMailHtml(rawHtml)) {
      const fromHtml = stripLeadingSubjectFromText(
        htmlToPlainText(rawHtml),
        subject
      );
      if (fromHtml?.trim()) return fromHtml;
    }
    return stripLeadingSubjectFromText(exchange.text, subject);
  }, [exchange.text, rawHtml, subject]);

  const plain = text?.trim() || '';

  // Designed / marketing HTML, or HTML-only messages with no plain part —
  // always render the authored HTML (Proton-style), never an empty plain stub.
  if (preparedHtml && (isRichMailHtml(rawHtml) || !plain)) {
    return (
      <MailHtmlFrame
        html={preparedHtml}
        invert={invert}
        eager={eager}
        className={className}
      />
    );
  }

  if (preparedHtml && isStructuredMailHtml(rawHtml)) {
    return (
      <MailStructuredBody
        html={preparedHtml}
        className={className}
      />
    );
  }

  return (
    <MailPlainBody
      text={plain}
      className={className}
    />
  );
}

function MailPreviousExchanges({
  exchanges,
  subject,
  origin,
  invert
}: {
  exchanges: MailExchange[];
  subject?: string | null;
  origin?: string;
  invert: boolean;
}): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const count = exchanges.length;
  const label = count === 1 ? 'Previous message' : `${count} earlier messages`;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="mt-4 border-t border-border/60 pt-3"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <span className="min-w-0">
            <span className="font-fellix text-sm font-medium">{label}</span>
            <span className="mt-0.5 block truncate font-info text-xs">
              {exchanges[0]?.attribution ||
                exchanges[0]?.text?.slice(0, 96) ||
                'Quoted conversation'}
            </span>
          </span>
          <ChevronDownIcon
            className={cn(
              'size-4 shrink-0 transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ol className="mt-3 space-y-4">
          {exchanges.map((exchange, index) => (
            <li
              key={`${exchange.attribution ?? 'prev'}-${index}`}
              className="border-l-2 border-border/70 pl-3"
            >
              {exchange.attribution ? (
                <p className="mb-1.5 font-info text-xs text-muted-foreground">
                  {exchange.attribution}
                </p>
              ) : null}
              <MailExchangeView
                exchange={exchange}
                subject={subject}
                origin={origin}
                invert={invert}
                eager={false}
                className="mt-0"
              />
            </li>
          ))}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
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
  const { resolvedTheme } = useTheme();
  const invert = resolvedTheme === 'dark';

  const origin =
    typeof window !== 'undefined' ? window.location.origin : undefined;

  const triage = React.useMemo(
    () => triageMailBody(bodyHtml, bodyText, subject),
    [bodyHtml, bodyText, subject]
  );

  return (
    <div className={className}>
      <MailExchangeView
        exchange={triage.latest}
        subject={subject}
        origin={origin}
        invert={invert}
        eager={eager}
        className="mt-0"
      />
      {triage.previous.length > 0 ? (
        <MailPreviousExchanges
          exchanges={triage.previous}
          subject={subject}
          origin={origin}
          invert={invert}
        />
      ) : null}
    </div>
  );
}
