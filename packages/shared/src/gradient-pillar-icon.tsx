"use client";

import * as React from "react";

export type PillarGradientTone = {
  from: string;
  to: string;
  glow: string;
};

export type GradientPillarIconProps = {
  gradId: string;
  tone: PillarGradientTone;
  size?: "sm" | "md";
  /** Inner plate. Default dark; `muted` lightens for cream footers. */
  plate?: "dark" | "muted";
  /** Extra classes on the inner plate (e.g. landing grain surface). */
  plateClassName?: string;
  className?: string;
  children: React.ReactNode;
};

const SIZE_CLASS = {
  sm: "size-10",
  md: "size-12",
} as const;

const PLATE_CLASS = {
  dark: "border-white/[0.12] bg-[#101010] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.1),0_22px_50px_-26px_rgb(0_0_0_/_0.85)]",
  muted:
    "border-[#070607]/[0.1] bg-[#7b7b73] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.14),0_18px_40px_-24px_rgb(0_0_0_/_0.35)]",
} as const;

/** Framework / pillar icon — gradient stroke, glow, inset depth; sharp brand radius. */
export function GradientPillarIcon({
  gradId,
  tone,
  size = "md",
  plate = "dark",
  plateClassName,
  className,
  children,
}: GradientPillarIconProps): React.JSX.Element {
  return (
    <div className={cn("relative inline-flex", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-3 opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-80"
        style={{
          background: `radial-gradient(circle, ${tone.glow}, transparent 72%)`,
        }}
      />

      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-none",
          SIZE_CLASS[size],
          PLATE_CLASS[plate],
          plateClassName,
          "origin-center scale-100 transition-transform duration-300 group-hover:scale-[1.03]",
        )}
        aria-hidden
      >
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-[58%]",
            plate === "muted"
              ? "bg-[radial-gradient(ellipse_90%_90%_at_50%_0%,rgb(255_255_255_/_0.16),transparent)]"
              : "bg-[radial-gradient(ellipse_90%_90%_at_50%_0%,rgb(255_255_255_/_0.09),transparent)]",
          )}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[1px] rounded-none border border-white/[0.04]"
        />

        <svg
          width="0"
          height="0"
          className="pointer-events-none absolute left-0 top-0 h-0 w-0 overflow-hidden"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={tone.from} />
              <stop offset="52%" stopColor={tone.from} stopOpacity="0.94" />
              <stop offset="100%" stopColor={tone.to} />
            </linearGradient>
          </defs>
        </svg>

        <div className="relative z-[1] flex size-full items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}

function cn(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
