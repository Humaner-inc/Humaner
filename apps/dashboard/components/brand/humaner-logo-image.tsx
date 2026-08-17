import * as React from 'react';
import Image from 'next/image';

import { getLogo } from '@/lib/theme/brand';
import { cn } from '@/lib/utils';

export type HumanerLogoImageProps = {
  alt?: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
};

/** Black mark in light theme, white mark in dark — no CSS invert. */
export function HumanerLogoImage({
  alt = '',
  width,
  height,
  className,
  priority = false
}: HumanerLogoImageProps): React.JSX.Element {
  return (
    <>
      <Image
        src={getLogo('light')}
        alt={alt}
        width={width}
        height={height}
        unoptimized
        priority={priority}
        className={cn('dark:hidden', className)}
      />
      <Image
        src={getLogo('dark')}
        alt={alt}
        width={width}
        height={height}
        unoptimized
        priority={priority}
        className={cn('hidden dark:block', className)}
      />
    </>
  );
}
