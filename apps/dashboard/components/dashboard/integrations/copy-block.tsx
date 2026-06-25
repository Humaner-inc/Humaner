'use client';

import * as React from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
      toast.success('Copied to clipboard');
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy — copy it manually');
    }
  }, [value]);

  return (
    <div
      className={cn(
        'relative rounded-lg border bg-muted/50 font-mono text-xs',
        className
      )}
    >
      {language && (
        <span className="absolute left-3 top-2 text-[10px] uppercase tracking-wide text-muted-foreground">
          {language}
        </span>
      )}
      <pre
        className={cn(
          'overflow-x-auto whitespace-pre-wrap break-all p-3 pr-12',
          language && 'pt-7'
        )}
      >
        {value}
      </pre>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1.5 top-1.5 size-7"
        onClick={handleCopy}
        aria-label="Copy"
      >
        {copied ? (
          <CheckIcon className="size-3.5 text-emerald-500" />
        ) : (
          <CopyIcon className="size-3.5" />
        )}
      </Button>
    </div>
  );
}
