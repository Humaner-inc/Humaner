'use client';

import { MailIcon } from '@humaner/shared/icons';
import { CERTIFICATION_HOLD_HINT } from '@humaner/shared/mail-providers';

import { BrandLogo } from '@/components/dashboard/integrations/brand-logo';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

export type CertificationHoldProvider = {
  id: string;
  name: string;
  logoDomain?: string | null;
};

export function CertificationHoldNote({
  providers,
  className,
  chipClassName
}: {
  providers: readonly CertificationHoldProvider[];
  className?: string;
  /** @deprecated Kept for call-site compatibility; unused in the banner layout. */
  labelClassName?: string;
  chipClassName?: string;
}): React.JSX.Element | null {
  if (providers.length === 0) return null;

  return (
    <div
      role="status"
      className={cn(
        dashboardRadiusClassName,
        'flex items-start gap-3 border border-border/70 bg-muted/50 py-3 pl-3.5 pr-3 sm:items-center',
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="text-sm font-medium leading-none text-foreground">
            Coming soon
          </p>
          <p className="font-mono text-[10px] font-medium uppercase leading-none tracking-[0.14em] text-[#001afc]">
            CASA · SOC 2
          </p>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Why these providers are waiting"
                  className="inline-flex size-4 shrink-0 translate-y-px items-center justify-center rounded-full border border-muted-foreground/30 font-mono text-[10px] leading-none text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
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
        <ul className="mt-2 flex flex-nowrap items-center gap-x-2.5 gap-y-1 overflow-x-auto opacity-70 grayscale">
          {providers.map((provider) => (
            <li
              key={provider.id}
              className={cn(
                'inline-flex min-w-0 shrink-0 items-center gap-1 text-[11px] leading-none text-muted-foreground',
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
                size={12}
                className="size-3"
              />
              <span className="truncate">{provider.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
