'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export type MailSignaturePreviewProps = {
  text: string | null;
  iconUrl: string | null;
  iconHeight?: number;
  className?: string;
};

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
          // eslint-disable-next-line @next/next/no-img-element -- mailbox signature asset
          <img
            src={iconUrl}
            alt=""
            height={iconHeight}
            style={{ height: iconHeight, width: 'auto', maxWidth: 240 }}
            className="object-contain"
          />
        ) : null}
        {trimmed ? (
          <p className="whitespace-pre-wrap text-foreground/80">{trimmed}</p>
        ) : null}
      </div>
    </div>
  );
}
