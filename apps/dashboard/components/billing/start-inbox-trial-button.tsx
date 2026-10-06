'use client';

import type * as React from 'react';

import type { ButtonProps } from '@/components/ui/button';

export function StartInboxTrialButton({
  children
}: ButtonProps & {
  interval?: 'month' | 'year';
}): React.JSX.Element | null {
  return children ? <>{children}</> : null;
}
