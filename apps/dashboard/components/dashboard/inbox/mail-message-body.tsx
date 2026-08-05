'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

function buildMailSrcDoc(bodyHtml: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base target="_blank" rel="noopener noreferrer"><style>
html,body{margin:0;padding:0}
body{
  color:#111;
  background:#fff;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  font-size:14px;
  line-height:1.5;
  word-wrap:break-word;
  overflow-wrap:anywhere;
}
img,video{max-width:100%;height:auto}
a{color:#0682de}
table{border-collapse:collapse;max-width:100%}
</style></head><body>${bodyHtml}</body></html>`;
}

export function MailMessageBody({
  bodyHtml,
  bodyText,
  className
}: {
  bodyHtml: string | null;
  bodyText: string | null;
  className?: string;
}): React.JSX.Element {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = React.useState(160);
  const html = bodyHtml?.trim() ? bodyHtml : null;
  const srcDoc = html ? buildMailSrcDoc(html) : null;

  React.useEffect(() => {
    if (!srcDoc) return;

    const frame = iframeRef.current;
    if (!frame) return;

    let resizeObserver: ResizeObserver | null = null;
    const imageListeners: Array<{ img: HTMLImageElement; fn: () => void }> = [];

    const measure = (): void => {
      const doc = frame.contentDocument;
      if (!doc?.body) return;

      const next = Math.ceil(
        Math.max(
          doc.body.scrollHeight,
          doc.documentElement?.scrollHeight ?? 0,
          80
        )
      );
      setHeight((prev) => (prev === next ? prev : next));
    };

    const onLoad = (): void => {
      measure();

      const doc = frame.contentDocument;
      if (!doc?.body) return;

      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(() => {
        measure();
      });
      resizeObserver.observe(doc.body);

      for (const { img, fn } of imageListeners) {
        img.removeEventListener('load', fn);
        img.removeEventListener('error', fn);
      }
      imageListeners.length = 0;

      for (const img of doc.querySelectorAll('img')) {
        if (img.complete) continue;
        const fn = (): void => measure();
        img.addEventListener('load', fn);
        img.addEventListener('error', fn);
        imageListeners.push({ img, fn });
      }
    };

    frame.addEventListener('load', onLoad);
    // Set after the listener so the load event is never missed.
    frame.srcdoc = srcDoc;

    return () => {
      frame.removeEventListener('load', onLoad);
      resizeObserver?.disconnect();
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
          'mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed',
          className
        )}
      >
        {bodyText || 'This message has no plain-text body.'}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'mt-3 overflow-hidden rounded-none border border-border/50 bg-white',
        className
      )}
    >
      <iframe
        ref={iframeRef}
        title="Email message"
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads"
        referrerPolicy="no-referrer"
        className="block w-full border-0 bg-white"
        style={{ height }}
      />
    </div>
  );
}
