'use client';

import * as React from 'react';

import { SkillzPixelGrid } from '@/components/ui/skillz-pixel-grid';
import {
  SKILLZ_GLYPH_PATTERN,
  SKILLZ_GLYPH_SPEC
} from '@/lib/skillz-pixel-grid';
import { cn } from '@/lib/utils';

const CYCLE_MS = 2400;
const FILL_MS = 1600;
const HOLD_MS = 400;

/**
 * Exact Skillz card cube — staggered square fill (landing Skillz glyph).
 * Pass `filled` for the completed static glyph.
 */
export function SkillzCubeLoader({
  className,
  size = 20,
  filled = false
}: {
  className?: string;
  size?: number;
  /** Fully filled cube (no loop). */
  filled?: boolean;
}): React.JSX.Element {
  const [fillProgress, setFillProgress] = React.useState(filled ? 1 : 0);
  const reducedMotion = React.useRef(false);

  React.useEffect(() => {
    if (filled) {
      setFillProgress(1);
      return;
    }

    reducedMotion.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (reducedMotion.current) {
      setFillProgress(0.72);
      return;
    }

    let raf = 0;
    const start = performance.now();

    const tick = (now: number): void => {
      const t = (now - start) % CYCLE_MS;
      let p = 0;
      if (t < FILL_MS) {
        p = t / FILL_MS;
      } else if (t < FILL_MS + HOLD_MS) {
        p = 1;
      } else {
        p = 1 - (t - FILL_MS - HOLD_MS) / (CYCLE_MS - FILL_MS - HOLD_MS);
      }
      setFillProgress(p);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [filled]);

  // Glyph viewBox is wider than tall (160×100); size is the width.
  const height = Math.round(
    size * (SKILLZ_GLYPH_SPEC.viewHeight / SKILLZ_GLYPH_SPEC.viewWidth)
  );

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        className
      )}
      style={{ width: size, height }}
      aria-hidden
    >
      <SkillzPixelGrid
        pattern={SKILLZ_GLYPH_PATTERN}
        fillProgress={fillProgress}
        active
        spec={SKILLZ_GLYPH_SPEC}
        className="size-full text-[color-mix(in_srgb,var(--accent-color,#e1ccaf)_35%,transparent)]"
        fillClassName="text-[var(--accent-color,#e1ccaf)]"
      />
    </span>
  );
}
