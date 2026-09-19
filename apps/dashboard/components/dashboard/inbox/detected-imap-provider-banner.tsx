'use client';

import { MailIcon } from '@humaner/shared/icons';

import { BrandLogo } from '@/components/dashboard/integrations/brand-logo';
import { Button } from '@/components/ui/button';
import type { DetectedMailProvider } from '@/lib/inbox/mail-providers';
import { cn } from '@/lib/utils';

export function DetectedImapProviderBanner({
  detection,
  onUseGoogle,
  className
}: {
  detection: DetectedMailProvider;
  onUseGoogle?: () => void;
  className?: string;
}): React.JSX.Element {
  const { provider, kind } = detection;
  const isGoogle = kind === 'oauth';

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5',
        className
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-background ring-1 ring-border/60">
        <BrandLogo
          domain={
            provider.logoDomain === 'humaner.io'
              ? undefined
              : provider.logoDomain
          }
          fallbackIcon={MailIcon}
          size={32}
          className="size-5"
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">
          Detected: {provider.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {isGoogle
            ? 'Connect with Google instead of IMAP.'
            : 'Using recommended IMAP settings'}
        </p>
      </div>
      {isGoogle && onUseGoogle ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0 font-mono text-[10px]"
          onClick={onUseGoogle}
        >
          Continue with Google
        </Button>
      ) : null}
    </div>
  );
}
