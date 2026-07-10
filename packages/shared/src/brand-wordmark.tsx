"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type CSSProperties,
} from "react";

export const BRAND_WORDMARK_DEFAULT = "Humaner";
export const BRAND_WORDMARK_HOVER = "Humaner";

/** Mono UI on hover — pairs with display `font-display` at rest. */
const HOVER_TYPOGRAPHY: CSSProperties = {
  fontFamily: "var(--font-humaner-mono), ui-monospace, monospace",
  fontWeight: 500,
  fontSynthesis: "none",
  letterSpacing: "0.02em",
};

/** Fast, letter-synced pixel pass — one block per glyph, left to right. */
const MORPH_MS = 220;
const PIXEL = ["▓", "█", "▒", "░"] as const;
const CHAR_SPREAD = 1.15;

function pixelFor(index: number): string {
  return PIXEL[index % PIXEL.length] ?? "▓";
}

function easeOutQuart(value: number): number {
  return 1 - (1 - value) ** 4;
}

function charLocal(progress: number, index: number, length: number): number {
  return (progress * (length + CHAR_SPREAD) - index) / CHAR_SPREAD;
}

function resolveChar(
  local: number,
  index: number,
  fromChar: string | undefined,
  toChar: string | undefined,
): string {
  if (local <= 0) {
    return fromChar ?? "";
  }

  if (local >= 1) {
    return toChar ?? "";
  }

  // Source → single pixel tick → target (deterministic, no random noise)
  if (local < 0.34) {
    return fromChar ?? pixelFor(index);
  }

  if (local < 0.62) {
    return pixelFor(index);
  }

  return toChar ?? pixelFor(index);
}

function morphText(progress: number, from: string, to: string): string {
  if (progress <= 0) {
    return from;
  }

  if (progress >= 1) {
    return to;
  }

  const sameText = from === to;
  const length = Math.max(from.length, to.length);
  const chars: string[] = [];

  for (let i = 0; i < length; i++) {
    const local = charLocal(progress, i, length);

    if (sameText) {
      // Font-only morph — always run the pixel pass even when glyphs match.
      if (local <= 0 || local >= 1) {
        chars.push(from[i] ?? "");
      } else if (local < 0.62) {
        chars.push(pixelFor(i));
      } else {
        chars.push(from[i] ?? pixelFor(i));
      }
      continue;
    }

    const resolved = resolveChar(local, i, from[i], to[i]);
    if (resolved) {
      chars.push(resolved);
    }
  }

  return chars.join("");
}

function hoverTypographyActive(progress: number, target: number): boolean {
  const settled = Math.abs(progress - target) <= 0.01;

  if (settled) {
    return target >= 1;
  }

  // Entering hover: keep display type until the pixel pass finishes.
  // Leaving hover: keep mono until the reverse pixel pass finishes.
  return target < 1;
}

export type BrandWordmarkProps = HTMLAttributes<HTMLSpanElement> & {
  children?: string;
  hoverText?: string;
  active?: boolean;
  /** When false, renders static text with no hover morph (for embeds, footers). */
  interactive?: boolean;
};

export function BrandWordmark({
  children = BRAND_WORDMARK_DEFAULT,
  hoverText = BRAND_WORDMARK_HOVER,
  active,
  interactive = true,
  className,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}: BrandWordmarkProps): React.JSX.Element {
  const from = children;
  const to = hoverText;
  const isControlled = active !== undefined;

  if (!interactive) {
    return (
      <span className={className} style={style} aria-label={from} {...props}>
        {from}
      </span>
    );
  }

  const [displayText, setDisplayText] = useState(from);
  const [useHoverTypography, setUseHoverTypography] = useState(false);

  const progressRef = useRef(0);
  const targetRef = useRef(0);
  const frameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);

  const stopAnimation = useCallback((): void => {
    if (frameRef.current !== undefined) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = undefined;
    }
    lastTimeRef.current = undefined;
  }, []);

  const tick = useCallback(
    (now: number): void => {
      if (lastTimeRef.current === undefined) {
        lastTimeRef.current = now;
      }

      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;
      const step = delta / MORPH_MS;
      const current = progressRef.current;
      const target = targetRef.current;

      if (current < target) {
        progressRef.current = Math.min(1, current + step);
      } else if (current > target) {
        progressRef.current = Math.max(0, current - step);
      }

      const settled = Math.abs(progressRef.current - target) <= 0.01;

      const eased = easeOutQuart(progressRef.current);

      if (settled) {
        progressRef.current = target;
        setDisplayText(target >= 1 ? to : from);
        setUseHoverTypography(
          hoverTypographyActive(progressRef.current, target),
        );
        stopAnimation();
        return;
      }

      setDisplayText(morphText(eased, from, to));
      setUseHoverTypography(
        hoverTypographyActive(progressRef.current, targetRef.current),
      );
      frameRef.current = requestAnimationFrame(tick);
    },
    [from, stopAnimation, to],
  );

  const startAnimation = useCallback(
    (nextTarget: number): void => {
      if (progressRef.current === nextTarget) {
        setDisplayText(nextTarget >= 1 ? to : from);
        setUseHoverTypography(
          hoverTypographyActive(progressRef.current, nextTarget),
        );
        return;
      }

      targetRef.current = nextTarget;
      stopAnimation();
      frameRef.current = requestAnimationFrame(tick);
    },
    [from, stopAnimation, tick, to],
  );

  const startAnimationRef = useRef(startAnimation);
  startAnimationRef.current = startAnimation;

  useEffect(() => {
    if (!isControlled) {
      return;
    }

    startAnimationRef.current(active ? 1 : 0);
  }, [active, isControlled]);

  useEffect(() => stopAnimation, [stopAnimation]);

  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        verticalAlign: "baseline",
        whiteSpace: "nowrap",
        ...(useHoverTypography ? HOVER_TYPOGRAPHY : {}),
        ...style,
      }}
      onMouseEnter={(event) => {
        if (!isControlled) {
          startAnimation(1);
        }
        onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        if (!isControlled) {
          startAnimation(0);
        }
        onMouseLeave?.(event);
      }}
      aria-label={from}
      {...props}
    >
      {displayText}
    </span>
  );
}
