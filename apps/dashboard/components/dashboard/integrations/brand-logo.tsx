'use client';

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';

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

export function BrandLogo({
  domain,
  fallbackIcon: FallbackIcon,
  size = 64,
  className
}: BrandLogoProps): React.JSX.Element {
  const [failed, setFailed] = React.useState(false);

  if (!domain || failed) {
    return <FallbackIcon className={cn('size-5', className)} />;
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
      className={cn('size-5 rounded object-contain', className)}
    />
  );
}
