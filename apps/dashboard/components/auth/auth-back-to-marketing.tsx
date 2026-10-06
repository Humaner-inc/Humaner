'use client';

import * as React from 'react';
import { ArrowLeftIcon } from '@humaner/shared/icons';
import { getLandingUrl } from '@humaner/shared/urls';

import { useOptionalAuthTheme } from '@/components/auth/auth-theme-context';
import { AppInfo } from '@/constants/app-info';
import { isOssDeployment } from '@/lib/deployment-mode';
import { cn } from '@/lib/utils';

/**
 * Returns to the marketing site. Cloud: humaner.io. Self-Host: landing URL / home.
 * Mobile + desktop: top-left corner.
 */
export function AuthBackToMarketing({
  onCanvas = false
}: {
  onCanvas?: boolean;
}): React.JSX.Element {
  const oss = isOssDeployment();
  const isInverted = useOptionalAuthTheme()?.isInverted ?? false;
  const onLight = onCanvas || isInverted;

  return (
    <a
      href={getLandingUrl()}
      aria-label={`Back to ${AppInfo.APP_NAME}`}
      className={cn(
        'absolute left-4 top-4 z-20 flex size-10 items-center justify-center transition-colors sm:left-6 sm:top-6',
        oss
          ? 'rounded-[0.5rem] text-[#18181b]/70 hover:bg-[#f2f2f2] hover:text-[#0A0D0D]'
          : onLight
            ? 'rounded-lg text-[#0A0D0D]/70 hover:bg-[#0A0D0D]/10 hover:text-[#0A0D0D]'
            : 'rounded-lg text-white/70 hover:bg-white/10 hover:text-white'
      )}
    >
      <ArrowLeftIcon className="size-5 shrink-0" />
    </a>
  );
}
