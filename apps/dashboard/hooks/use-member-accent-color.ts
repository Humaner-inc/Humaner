import * as React from 'react';

import {
  colorFromMemberSeed,
  sampleImageAccent
} from '@/lib/team/member-color';

export function useMemberAccentColor(
  seed: string,
  image?: string | null
): string {
  const fallback = colorFromMemberSeed(seed);
  const [color, setColor] = React.useState(fallback);

  React.useEffect(() => {
    setColor(fallback);
    if (!image) return;
    let cancelled = false;
    void sampleImageAccent(image).then((sampled) => {
      if (!cancelled && sampled) setColor(sampled);
    });
    return () => {
      cancelled = true;
    };
  }, [fallback, image]);

  return color;
}
