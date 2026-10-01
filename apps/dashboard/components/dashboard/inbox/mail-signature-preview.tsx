'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export type MailSignaturePreviewProps = {
  text: string | null;
  iconUrl: string | null;
  iconHeight?: number;
  className?: string;
};

const ICON_MAX_WIDTH = 240;

/** Keeps upload aspect ratio — same math as outbound HTML mail. */
export function MailboxSignatureIconImg({
  src,
  height,
  className
}: {
  src: string;
  height: number;
  className?: string;
}): React.JSX.Element {
  const [width, setWidth] = React.useState<number | null>(null);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- mailbox signature asset
    <img
      src={src}
      alt=""
      width={width ?? undefined}
      height={height}
      onLoad={(event) => {
        const img = event.currentTarget;
        if (!img.naturalWidth || !img.naturalHeight) return;
        setWidth(
          Math.min(
            ICON_MAX_WIDTH,
            Math.max(
              1,
              Math.round((height * img.naturalWidth) / img.naturalHeight)
            )
          )
        );
      }}
      className={className}
      style={{
        display: 'block',
        height,
        width: width ?? 'auto',
        maxWidth: ICON_MAX_WIDTH,
        objectFit: 'contain'
      }}
    />
  );
}

export function MailSignaturePreview({
  text,
  iconUrl,
  iconHeight = 48,
  className
}: MailSignaturePreviewProps): React.JSX.Element | null {
  const trimmed = text?.trim() ?? '';
  if (!trimmed && !iconUrl) return null;

  return (
    <div
      aria-label="Email signature"
      className={cn(
        'pointer-events-none select-none border-t border-border/60 pt-3 text-sm text-muted-foreground',
        className
      )}
    >
      <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
        Signature
      </p>
      <div className="space-y-2">
        <p aria-hidden>—</p>
        {iconUrl ? (
          <MailboxSignatureIconImg
            src={iconUrl}
            height={iconHeight}
          />
        ) : null}
        {trimmed ? (
          <p className="whitespace-pre-wrap text-foreground/80">{trimmed}</p>
        ) : null}
      </div>
    </div>
  );
}
