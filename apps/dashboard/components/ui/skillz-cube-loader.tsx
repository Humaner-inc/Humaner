'use client';

import type { JSX } from 'react';
import { SquircleLoader } from '@humaner/shared/squircle-loader';

/** Page / pane loading indicator — ldrs Squircle, sized to surrounding text. */
export function SkillzCubeLoader({
  className,
  size
}: {
  className?: string;
  size?: number;
  filled?: boolean;
  emptyClassName?: string;
  fillClassName?: string;
}): JSX.Element {
  return (
    <SquircleLoader
      className={className}
      size={size}
    />
  );
}
