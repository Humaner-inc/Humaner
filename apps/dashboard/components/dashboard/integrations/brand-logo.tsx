'use client';

import * as React from 'react';
import type { LucideIcon } from '@humaner/shared/icons';

import { getLogoUrl } from '@/lib/logo';
import { cn } from '@/lib/utils';

export type BrandLogoProps = {
  /** Brand domain to fetch from logo.dev (via the server proxy). */
  domain?: string;
  /** Fallback icon when there is no domain or the logo fails to load. */
  fallbackIcon: LucideIcon;
  /** Pixel size requested from the proxy. */
  size?: number;
  className?: string;
};

function invertOnDark(domain: string): boolean {
  return domain === 'github.com' || domain.endsWith('.github.com');
}

export function BrandLogo({
  domain,
  fallbackIcon: FallbackIcon,
  size = 64,
  className
}: BrandLogoProps): React.JSX.Element {
  const [failed, setFailed] = React.useState(false);
  const invert = domain ? invertOnDark(domain) : false;

  if (!domain || failed) {
    return (
      <FallbackIcon
        className={cn(
          'size-5',
          invert && 'dark:brightness-0 dark:invert',
          className
        )}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getLogoUrl(domain, size)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn(
        'size-5 rounded object-contain',
        invert && 'dark:brightness-0 dark:invert',
        className
      )}
    />
  );
}
