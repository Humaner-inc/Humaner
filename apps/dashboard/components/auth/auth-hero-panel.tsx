'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * CollabInbox scene for the auth page — same art/motion as the landing
 * hero, without scroll-driven fly-away. Markup is passed from the server.
 */
export function AuthHeroPanel({
  markup,
  className
}: {
  markup: string;
  className?: string;
}): React.JSX.Element {
  return (
    <div
      className={cn('auth-collab-inbox', className)}
      aria-hidden
      dangerouslySetInnerHTML={markup ? { __html: markup } : undefined}
    />
  );
}
