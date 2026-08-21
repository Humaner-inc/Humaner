import * as React from 'react';
import { BrandMark } from '@humaner/shared/brand-mark';

import { cn } from '@/lib/utils';

export type HumanerLogoImageProps = {
  alt?: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  /** Force ink for a dark or light surface, ignoring html theme. */
  tone?: 'light' | 'dark';
};

/** Compact icon — `icon_black.svg` on cream/light, `icon.svg` on dark. */
export function HumanerLogoImage({
  alt = '',
  width,
  height,
  className,
  tone,
  priority: _priority
}: HumanerLogoImageProps): React.JSX.Element {
  const style = { width, height };
  const label = alt || undefined;

  if (tone === 'dark') {
    return (
      <BrandMark
        aria-label={label}
        className={cn(className)}
        style={style}
      />
    );
  }

  if (tone === 'light') {
    return (
      <BrandMark
        invert
        aria-label={label}
        className={cn(className)}
        style={style}
      />
    );
  }

  return (
    <>
      <BrandMark
        invert
        aria-label={label}
        className={cn('dark:hidden', className)}
        style={style}
      />
      <BrandMark
        aria-label={label}
        className={cn('hidden dark:block', className)}
        style={style}
      />
    </>
  );
}
