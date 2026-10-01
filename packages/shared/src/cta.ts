/**
 * Brand CTAs — mono, frosted glass.
 *
 * Colors are literal brand neutrals (#0A0D0D / #fcf4ec / #18181b), never
 * theme-relative tokens (`background`/`foreground`). Those tokens flip per
 * app/dark-mode and can end up matching the surface a button sits on, making
 * it disappear.
 *
 * Primary / secondary keep their existing radii (16px / 14px).
 * Frame grey (#18181b) is selective fracture only — not a default CTA.
 */

import {
  radiusCtaPrimaryClassName,
  radiusCtaSecondaryClassName,
} from "./radius";

const CTA_GLASS =
  "backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.14)]";

const CTA_LAYOUT = `inline-flex items-center justify-center font-mono text-xs font-medium normal-case tracking-normal transition-[color,background-color,border-color,box-shadow,backdrop-filter] duration-200 disabled:pointer-events-none disabled:opacity-50 ${CTA_GLASS}`;

export const CTA_BASE = `${CTA_LAYOUT} ${radiusCtaPrimaryClassName}`;

const CTA_SECONDARY_BASE = `${CTA_LAYOUT} ${radiusCtaSecondaryClassName}`;

/** Dashboard nav CTA — mono, 16px. */
export const CTA_DASHBOARD_BASE = `inline-flex items-center justify-center ${radiusCtaPrimaryClassName} font-mono text-sm font-medium transition-[color,background-color,border-color,box-shadow,backdrop-filter] duration-200 disabled:pointer-events-none disabled:opacity-50 ${CTA_GLASS}`;

/** Frosted cream pill on dark surfaces (nav). */
export const ctaDashboardOnDarkClassName = `${CTA_DASHBOARD_BASE} border border-white/20 bg-white/80 px-3.5 py-1.5 text-[#0A0D0D] hover:border-white/35 hover:bg-white/90`;

/** Frosted ink pill on light surfaces (e.g. vision hero). */
export const ctaDashboardOnLightClassName = `${CTA_DASHBOARD_BASE} border border-[#0A0D0D]/15 bg-[#0A0D0D]/80 px-3.5 py-1.5 text-[#fcf4ec] hover:border-[#0A0D0D]/25 hover:bg-[#0A0D0D]/90`;

export function getCtaDashboardClassName(surface: "light" | "dark"): string {
  return surface === "dark"
    ? ctaDashboardOnDarkClassName
    : ctaDashboardOnLightClassName;
}

/** Frosted cream — use on dark surfaces. */
export const ctaPrimaryClassName = `${CTA_BASE} border border-[#fcf4ec]/40 bg-[#fcf4ec]/80 px-4 py-2 text-[#0A0D0D] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.55)] hover:border-white hover:bg-[#fcf4ec]/95 hover:text-[#0A0D0D]`;

/** Frosted ink — use on light surfaces. Text stays cream. */
export const ctaPrimaryOnLightClassName = `${CTA_BASE} border border-[#0A0D0D]/20 bg-[#0A0D0D]/85 px-4 py-2 text-[#fcf4ec] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.12)] hover:border-[#0A0D0D]/30 hover:bg-[#0A0D0D]/95 hover:text-[#fcf4ec]`;

/** Frosted outline on dark surfaces. */
export const ctaSecondaryOnDarkClassName = `${CTA_SECONDARY_BASE} border border-white/20 bg-white/[0.08] px-4 py-2 text-white/90 hover:border-white/35 hover:bg-white/[0.16] hover:text-white`;

/** Frosted outline on light surfaces. */
export const ctaSecondaryOnLightClassName = `${CTA_SECONDARY_BASE} border border-[#0A0D0D]/15 bg-[#0A0D0D]/[0.06] px-4 py-2 text-[#0A0D0D]/85 hover:border-[#0A0D0D]/25 hover:bg-[#0A0D0D]/[0.12] hover:text-[#0A0D0D]`;

/** Outline CTA that inverts for dashboard light/dark shells. */
export const ctaSecondaryAdaptiveClassName = `${ctaSecondaryOnLightClassName} dark:border-white/20 dark:bg-white/[0.08] dark:text-white/90 dark:hover:border-white/35 dark:hover:bg-white/[0.16] dark:hover:text-white`;

/** Text on an accent-filled CTA (`#e0e1df`). */
export const ACCENT_CTA_TEXT_LIGHT = "#0A0D0D";
export const ACCENT_CTA_TEXT_DARK = "#f2f2f2";

export function getAccentCtaTextColor(surface: "light" | "dark"): string {
  return surface === "dark" ? ACCENT_CTA_TEXT_DARK : ACCENT_CTA_TEXT_LIGHT;
}

/** Accent deploy CTA — frosted accent fill on dark surfaces. */
export const ctaAccentClassName = `${CTA_BASE} border border-accent/40 bg-accent/85 px-6 py-3 text-sm text-[#0A0D0D] hover:bg-accent/95 hover:text-[#0A0D0D]`;

/** Frame grey CTA — frosted fracture on dark or light sections. */
export const ctaFrameClassName = `${CTA_BASE} border border-[#18181b]/40 bg-[#18181b]/85 px-4 py-2 text-[#fcf4ec] hover:bg-[#18181b]/95 hover:text-[#fcf4ec]`;

const CTA_TRY_HUMANER_BASE = `${CTA_BASE} gap-2.5 px-5 py-3`;

/** Frosted cream — floating over dark sections. */
export const ctaTryHumanerOnDarkClassName = `${CTA_TRY_HUMANER_BASE} border border-[#fcf4ec]/40 bg-[#fcf4ec]/80 text-[#0A0D0D] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.55)] hover:border-white hover:bg-[#fcf4ec]/95 hover:text-[#0A0D0D]`;

/** Frosted ink — floating over light sections. */
export const ctaTryHumanerOnLightClassName = `${CTA_TRY_HUMANER_BASE} border border-[#0A0D0D]/20 bg-[#0A0D0D]/85 text-[#fcf4ec] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.12)] hover:border-[#0A0D0D]/30 hover:bg-[#0A0D0D]/95 hover:text-[#fcf4ec]`;

export const ctaTryHumanerClassName = ctaTryHumanerOnDarkClassName;

export function getCtaTryHumanerClassName(surface: "light" | "dark"): string {
  return surface === "dark"
    ? ctaTryHumanerOnDarkClassName
    : ctaTryHumanerOnLightClassName;
}

export function getCtaTryHumanerIconClassName(
  surface: "light" | "dark",
): string {
  return surface === "dark"
    ? "flex size-4 shrink-0 items-center justify-center text-[#0A0D0D]"
    : "flex size-4 shrink-0 items-center justify-center text-[#e0e1df]";
}

export const ctaTryHumanerIconClassName = getCtaTryHumanerIconClassName("dark");

const CTA_TRY_HUMANER_LABEL_BASE =
  "font-mono text-xs font-medium normal-case tracking-normal";

export function getCtaTryHumanerLabelClassName(
  surface: "light" | "dark",
): string {
  return surface === "dark"
    ? `${CTA_TRY_HUMANER_LABEL_BASE} text-[#0A0D0D]`
    : `${CTA_TRY_HUMANER_LABEL_BASE} text-[#fcf4ec]`;
}

export const ctaTryHumanerLabelClassName =
  getCtaTryHumanerLabelClassName("dark");

export function getBranchTagClassName(
  state: "active" | "engaged" | "idle",
  surface: "light" | "dark",
): string {
  if (state === "active") {
    return surface === "dark"
      ? ctaPrimaryClassName
      : ctaPrimaryOnLightClassName;
  }

  const secondary =
    surface === "dark"
      ? ctaSecondaryOnDarkClassName
      : ctaSecondaryOnLightClassName;

  return state === "idle" ? `${secondary} opacity-50` : secondary;
}
