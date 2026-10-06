'use client';

import { MailIcon } from '@humaner/shared/icons';
import {
  CERTIFICATION_HOLD_HINT,
  CERTIFICATION_HOLD_LABEL
} from '@humaner/shared/mail-providers';

import { BrandLogo } from '@/components/dashboard/integrations/brand-logo';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type CertificationHoldProvider = {
  id: string;
  name: string;
  logoDomain?: string | null;
};

export function CertificationHoldNote({
  providers,
  className,
  labelClassName,
  chipClassName
}: {
  providers: readonly CertificationHoldProvider[];
  className?: string;
  labelClassName?: string;
  chipClassName?: string;
}): React.JSX.Element | null {
  if (providers.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-start gap-1.5">
        <p
          className={cn(
            'font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-muted-foreground',
            labelClassName
          )}
        >
          {CERTIFICATION_HOLD_LABEL}
        </p>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Why these providers are waiting"
                className="mt-px inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-current/25 font-mono text-[10px] leading-none text-muted-foreground"
              >
                ?
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-56 text-left"
            >
              {CERTIFICATION_HOLD_HINT}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 opacity-60 grayscale">
        {providers.map((provider) => (
          <li
            key={provider.id}
            className={cn(
              'inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground',
              chipClassName
            )}
          >
            <BrandLogo
              domain={
                provider.logoDomain && provider.logoDomain !== 'humaner.io'
                  ? provider.logoDomain
                  : undefined
              }
              fallbackIcon={MailIcon}
              size={14}
              className="size-3.5"
            />
            <span className="truncate">{provider.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
