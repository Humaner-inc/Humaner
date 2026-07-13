'use client';

import * as React from 'react';

import { isMac } from '@/lib/browser/is-mac';

/** Returns ⌘ on macOS and Ctrl elsewhere — client-only to avoid SSR mismatch. */
export function useModifierKeyLabel(): string {
  const [modifier, setModifier] = React.useState('Ctrl');

  React.useEffect(() => {
    setModifier(isMac() ? '⌘' : 'Ctrl');
  }, []);

  return modifier;
}
