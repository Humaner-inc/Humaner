'use client';

import * as React from 'react';

import { getLogoUrl, toHostname } from '@/lib/logo';
import { cn, getInitials } from '@/lib/utils';

export type BusinessLogoProps = {
  /** Business website (any URL/domain form) — logo is derived from this. */
  website?: string | null;
  /** Business name, used for the initials fallback. */
  name?: string | null;
  size?: number;
  className?: string;
};

/**
 * Renders the organization's brand logo, auto-detected from its website via
 * logo.dev. Falls back to name initials when there is no website / logo.
 */
export function BusinessLogo({
  website,
  name,
  size = 64,
  className
}: BusinessLogoProps): React.JSX.Element {
  const [failed, setFailed] = React.useState(false);
  const domain = website ? toHostname(website) : null;

  React.useEffect(() => {
    setFailed(false);
  }, [domain]);

  if (!domain || failed) {
    return (
      <div
        className={cn(
          'flex size-full items-center justify-center bg-secondary text-sm font-medium text-muted-foreground',
          className
        )}
      >
        {name ? getInitials(name) : '?'}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getLogoUrl(domain, size, true)}
      alt={name ? `${name} logo` : 'Business logo'}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={cn('size-full object-cover', className)}
    />
  );
}
