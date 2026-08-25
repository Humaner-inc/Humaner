'use client';

import * as React from 'react';
import { maskApiKey } from '@humaner/shared';
import {
  CheckIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon
} from '@humaner/shared/icons';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { InputWithAdornments } from '@/components/ui/input-with-adornments';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { cn } from '@/lib/utils';

export function MaskedApiKeyField({
  apiKey,
  className,
  inputClassName
}: {
  apiKey: string;
  className?: string;
  inputClassName?: string;
}): React.JSX.Element {
  const copyToClipboard = useCopyToClipboard();
  const [copied, setCopied] = React.useState(false);
  const [revealed, setRevealed] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    if (!apiKey) {
      return;
    }
    await copyToClipboard(apiKey);
    setCopied(true);
    toast.success('Copied!');
    window.setTimeout(() => setCopied(false), 2000);
  }, [apiKey, copyToClipboard]);

  return (
    <InputWithAdornments
      readOnly
      type="text"
      autoComplete="off"
      spellCheck={false}
      value={revealed ? apiKey : maskApiKey(apiKey)}
      className={cn(
        'pr-[4.5rem] font-mono text-xs tracking-wide',
        inputClassName
      )}
      containerClassName={className}
      endAdornment={
        <div className="-mr-1 flex items-center pointer-events-auto">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={revealed ? 'Hide API key' : 'Show API key'}
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={() => setRevealed((prev) => !prev)}
            onMouseDown={(event) => event.preventDefault()}
          >
            {revealed ? (
              <EyeOffIcon className="size-4 shrink-0" />
            ) : (
              <EyeIcon className="size-4 shrink-0" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Copy API key"
            className="size-8 text-primary hover:text-primary"
            onClick={() => {
              void handleCopy();
            }}
          >
            {copied ? (
              <CheckIcon className="size-4 shrink-0 text-success" />
            ) : (
              <CopyIcon className="size-4 shrink-0" />
            )}
          </Button>
        </div>
      }
    />
  );
}
