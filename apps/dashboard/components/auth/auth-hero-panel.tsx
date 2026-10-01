'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * CollabInbox scene for the auth right panel — same art/motion as the
 * landing hero, without scroll-driven fly-away.
 */
export function AuthHeroPanel({
  className
}: {
  className?: string;
} = {}): React.JSX.Element {
  const [markup, setMarkup] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    void fetch('/CollabInbox.svg')
      .then((res) => res.text())
      .then((svg) => {
        if (!cancelled) setMarkup(svg);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className={cn('auth-collab-inbox', className)}
      aria-hidden
      dangerouslySetInnerHTML={markup ? { __html: markup } : undefined}
    />
  );
}
