'use client';

import * as React from 'react';
import { ArrowLeftIcon } from '@humaner/shared/icons';
import { getLandingUrl } from '@humaner/shared/urls';

import { useOptionalOnboardingTheme } from '@/components/onboarding/onboarding-theme-context';
import { AppInfo } from '@/constants/app-info';
import { isOssDeployment } from '@/lib/deployment-mode';
import { cn } from '@/lib/utils';

/**
 * Returns to the marketing site. Cloud: humaner.io. Self-Host: landing URL / home.
 * Mobile: top-left corner. Desktop: left edge of the auth panel, vertically centered.
 */
export function AuthBackToMarketing(): React.JSX.Element {
  const oss = isOssDeployment();
  const isInverted = useOptionalOnboardingTheme()?.isInverted ?? false;

  return (
    <a
      href={getLandingUrl()}
      aria-label={`Back to ${AppInfo.APP_NAME}`}
      className={cn(
        'absolute left-4 top-4 z-20 flex size-10 items-center justify-center transition-colors sm:left-6',
        'lg:top-1/2 lg:-translate-y-1/2',
        oss
          ? 'rounded-[0.5rem] text-[#18181b]/70 hover:bg-[#f2f2f2] hover:text-[#0A0D0D]'
          : isInverted
            ? 'rounded-none text-[#0A0D0D]/70 hover:bg-[#0A0D0D]/10 hover:text-[#0A0D0D]'
            : 'rounded-none text-white/70 hover:bg-white/10 hover:text-white'
      )}
    >
      <ArrowLeftIcon className="size-5 shrink-0" />
    </a>
  );
}
