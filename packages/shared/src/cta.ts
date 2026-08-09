/**
 * Brand CTAs — mono, sharp corners, border-driven.
 *
 * Colors are literal brand neutrals (#0A0D0D / #fff8f2 / #18181b), never
 * theme-relative tokens (`background`/`foreground`). Those tokens flip per
 * app/dark-mode and can end up matching the surface a button sits on, making
 * it disappear.
 *
 * Secondary CTAs are outline-only (transparent fill).
 * Frame grey (#18181b) is selective fracture only — not a default CTA.
 */

export const CTA_BASE =
  "inline-flex items-center justify-center rounded-none font-mono text-xs font-medium uppercase tracking-wider transition-[color,background-color,border-color,box-shadow] duration-200 disabled:pointer-events-none disabled:opacity-50";

/** Pill Dashboard nav CTA — mono, sharp. */
export const CTA_DASHBOARD_BASE =
  "inline-flex items-center justify-center rounded-none font-mono text-sm font-medium transition-colors hover:opacity-90 disabled:pointer-events-none disabled:opacity-50";

/** White pill on dark surfaces. */
export const ctaDashboardOnDarkClassName = `${CTA_DASHBOARD_BASE} border border-white/20 bg-white px-3.5 py-1.5 text-[#0A0D0D] hover:bg-white/90`;

/** Inverted pill on light surfaces (e.g. vision hero). */
export const ctaDashboardOnLightClassName = `${CTA_DASHBOARD_BASE} border border-foreground/15 bg-foreground px-3.5 py-1.5 text-[#fff8f2] hover:bg-foreground/90`;

export function getCtaDashboardClassName(surface: "light" | "dark"): string {
  return surface === "dark"
    ? ctaDashboardOnDarkClassName
    : ctaDashboardOnLightClassName;
}

/** Cream button — use on dark surfaces. Soft hover lift, no heavy glow. */
export const ctaPrimaryClassName = `${CTA_BASE} border border-[#fff8f2]/30 bg-[#fff8f2] px-4 py-2 text-[#0A0D0D] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.4)] hover:border-white hover:bg-white hover:text-[#0A0D0D] hover:shadow-[0_0_10px_rgb(255_255_255_/_0.18),inset_0_1px_0_rgb(255_255_255_/_0.7)] dark:hover:border-white dark:hover:bg-white dark:hover:text-[#0A0D0D]`;

/** Black button — use on light surfaces. Text always stays cream. */
export const ctaPrimaryOnLightClassName = `${CTA_BASE} border border-[#0A0D0D]/15 bg-[#0A0D0D] px-4 py-2 text-[#fff8f2] hover:bg-[#0A0D0D]/85 hover:text-[#fff8f2]`;

export const ctaSecondaryOnDarkClassName = `${CTA_BASE} border border-white/25 bg-transparent px-4 py-2 text-white/80 hover:border-transparent hover:bg-[#fff8f2] hover:text-[#0A0D0D]`;

export const ctaSecondaryOnLightClassName = `${CTA_BASE} border border-[#0A0D0D]/30 bg-transparent px-4 py-2 text-[#0A0D0D]/80 hover:border-transparent hover:bg-[#0A0D0D] hover:text-[#fff8f2]`;

/** Outline CTA that inverts for dashboard light/dark shells. */
export const ctaSecondaryAdaptiveClassName = `${ctaSecondaryOnLightClassName} dark:border-white/25 dark:bg-transparent dark:text-white/80 dark:hover:border-transparent dark:hover:bg-[#fff8f2] dark:hover:text-[#0A0D0D]`;

/** Accent deploy CTA — roadmap close, branch terminus. */
export const ctaAccentClassName = `${CTA_BASE} border border-accent/40 bg-accent px-6 py-3 text-sm text-[#0A0D0D] hover:bg-accent/90 hover:text-[#0A0D0D]`;

/** Frame grey CTA — selective sleek fracture on dark or light sections. */
export const ctaFrameClassName = `${CTA_BASE} border border-[#18181b]/40 bg-[#18181b] px-4 py-2 text-[#fff8f2] hover:bg-[#1c1c1e] hover:text-[#fff8f2]`;

const CTA_TRY_HUMANER_BASE = `${CTA_BASE} gap-2.5 px-5 py-3`;

/** Cream pill — use when floating over dark sections. Soft hover lift, no heavy glow. */
export const ctaTryHumanerOnDarkClassName = `${CTA_TRY_HUMANER_BASE} border border-white/15 bg-[#fff8f2] text-[#0A0D0D] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.4)] hover:border-white hover:bg-white hover:text-[#0A0D0D] hover:shadow-[0_0_10px_rgb(255_255_255_/_0.18),inset_0_1px_0_rgb(255_255_255_/_0.7)] dark:hover:border-white dark:hover:bg-white dark:hover:text-[#0A0D0D]`;

/** Black pill — use when floating over light sections. */
export const ctaTryHumanerOnLightClassName = `${CTA_TRY_HUMANER_BASE} border border-[#0A0D0D]/10 bg-[#0A0D0D] text-[#fff8f2] hover:bg-[#0A0D0D]/90 hover:text-[#fff8f2]`;

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
    : "flex size-4 shrink-0 items-center justify-center text-[#e1ccaf]";
}

export const ctaTryHumanerIconClassName = getCtaTryHumanerIconClassName("dark");

const CTA_TRY_HUMANER_LABEL_BASE =
  "font-mono text-xs font-medium uppercase tracking-[0.14em]";

export function getCtaTryHumanerLabelClassName(
  surface: "light" | "dark",
): string {
  return surface === "dark"
    ? `${CTA_TRY_HUMANER_LABEL_BASE} text-[#0A0D0D]`
    : `${CTA_TRY_HUMANER_LABEL_BASE} text-[#fff8f2]`;
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
