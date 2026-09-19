"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
} from "react";
import { Squircle } from "ldrs/react";
import "ldrs/react/Squircle.css";

const COLOR_LIGHT = "#0A0D0D";
const COLOR_DARK = "#fcf4ec";
const STROKE_AT_37 = 5;

export type SquircleLoaderProps = {
  /** Pixel size. Omit to match the surrounding text (`1em`). */
  size?: number;
  className?: string;
  /** Override theme color. Defaults to Humaner black / cream. */
  color?: string;
  style?: CSSProperties;
};

function readThemeColor(): string {
  if (typeof document === "undefined") return COLOR_LIGHT;
  return document.documentElement.classList.contains("dark")
    ? COLOR_DARK
    : COLOR_LIGHT;
}

function readEmPx(el: HTMLElement | null): number {
  if (!el) return 14;
  const px = parseFloat(getComputedStyle(el).fontSize);
  return Number.isFinite(px) && px > 0 ? Math.round(px) : 14;
}

export function SquircleLoader({
  size,
  className,
  color,
  style,
}: SquircleLoaderProps): JSX.Element {
  const hostRef = useRef<HTMLSpanElement>(null);
  const [themeColor, setThemeColor] = useState(readThemeColor);
  const [emPx, setEmPx] = useState(14);

  useEffect(() => {
    const sync = (): void => {
      setThemeColor(readThemeColor());
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (size != null) return;
    const el = hostRef.current;
    if (!el) return;

    const update = (): void => {
      setEmPx(readEmPx(el));
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [size]);

  const px = size ?? emPx;
  const stroke = Math.max(1.5, (px / 37) * STROKE_AT_37);

  return (
    <span
      ref={hostRef}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size ?? "1em",
        height: size ?? "1em",
        ...style,
      }}
      role="status"
      aria-label="Loading"
      suppressHydrationWarning
    >
      <Squircle
        size={px}
        stroke={stroke}
        strokeLength={0.15}
        bgOpacity={0.1}
        speed={0.9}
        color={color ?? themeColor}
      />
    </span>
  );
}
