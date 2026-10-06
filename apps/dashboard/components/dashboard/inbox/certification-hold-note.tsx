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

function CasaMark({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      aria-hidden
      fill="none"
    >
      <path
        d="M8 1.2 13.4 3.6v4.1c0 3.2-2.2 5.5-5.4 6.7C4.8 13.2 2.6 10.9 2.6 7.7V3.6L8 1.2Z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M5.35 7.85 7.05 9.5l3.6-3.7"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Soc2Mark({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      aria-hidden
      fill="none"
    >
      <circle
        cx="8"
        cy="8"
        r="6.35"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="1"
      />
      <text
        x="8"
        y="9.15"
        textAnchor="middle"
        fill="currentColor"
        fontSize="4.6"
        fontWeight="700"
        letterSpacing="0.2"
        className="font-sans"
      >
        SOC
      </text>
    </svg>
  );
}

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
      <div
        className={cn(
          'inline-flex max-w-full items-center gap-2 rounded-md border border-[#001afc]/30 bg-[#001afc]/10 px-2.5 py-1.5 text-[#001afc]',
          labelClassName
        )}
      >
        <span
          className="flex shrink-0 items-center gap-1"
          aria-hidden
        >
          <CasaMark className="size-3.5" />
          <Soc2Mark className="size-3.5" />
        </span>
        <p className="min-w-0 font-mono text-[10px] leading-snug tracking-[0.02em]">
          {CERTIFICATION_HOLD_LABEL}
        </p>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Why these providers are waiting"
                className="inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-current/30 font-mono text-[10px] leading-none text-current"
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
