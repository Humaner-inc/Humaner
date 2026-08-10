'use client';

import * as React from 'react';

/** True after the first client paint — use to defer Radix widgets that generate unstable SSR ids. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
