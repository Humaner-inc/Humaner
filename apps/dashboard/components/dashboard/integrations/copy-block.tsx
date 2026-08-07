'use client';

import * as React from 'react';
import { CheckIcon, CopyIcon } from '@humaner/shared/icons';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

export type CopyBlockProps = {
  value: string;
  language?: string;
  className?: string;
};

export function CopyBlock({
  value,
  language,
  className
}: CopyBlockProps): React.JSX.Element {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Copied');
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy — copy it manually');
    }
  }, [value]);

  return (
    <div
      className={cn(
        'overflow-hidden border border-border/60 bg-muted/20',
        dashboardRadiusClassName,
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/50 px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {language ?? 'code'}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
          aria-label="Copy"
        >
          {copied ? (
            <CheckIcon className="size-3.5 text-foreground" />
          ) : (
            <CopyIcon className="size-3.5" />
          )}
        </Button>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-all p-3 font-mono text-[11px] leading-relaxed text-foreground/90">
        {value}
      </pre>
    </div>
  );
}
