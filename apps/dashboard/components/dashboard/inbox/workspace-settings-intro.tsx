'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export function WorkspaceSettingsIntro({
  text,
  className
}: {
  text: string;
  className?: string;
}): React.JSX.Element {
  const [displayed, setDisplayed] = React.useState(text);
  const [visible, setVisible] = React.useState(true);
  const reduceMotion = React.useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  );

  React.useEffect(() => {
    if (text === displayed) return;
    if (reduceMotion) {
      setDisplayed(text);
      setVisible(true);
      return;
    }

    setVisible(false);
    const frame = window.setTimeout(() => {
      setDisplayed(text);
      setVisible(true);
    }, 160);

    return () => window.clearTimeout(frame);
  }, [displayed, reduceMotion, text]);

  return (
    <p
      className={cn(
        'max-w-xl text-sm text-muted-foreground transition-opacity duration-150 ease-out motion-reduce:transition-none',
        visible ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      {displayed}
    </p>
  );
}

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}
