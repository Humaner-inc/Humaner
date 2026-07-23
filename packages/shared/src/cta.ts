/**
 * Brand CTAs — mono, sharp corners, border-driven.
 *
 * Colors are literal brand neutrals (#070607 / #fff8f2 / #7b7b73), never
 * theme-relative tokens (`background`/`foreground`). Those tokens flip per
 * app/dark-mode and can end up matching the surface a button sits on, making
 * it disappear.
 *
 * Secondary CTAs are outline-only (transparent fill).
 * Frame grey (#7b7b73) is selective fracture only — not a default CTA.
 */

export const CTA_BASE =
  "inline-flex items-center justify-center rounded-none font-mono text-xs font-medium uppercase tracking-wider transition-[color,background-color,border-color,box-shadow] duration-200 disabled:pointer-events-none disabled:opacity-50";

/** Pill Dashboard nav CTA — mono, sharp. */
export const CTA_DASHBOARD_BASE =
  "inline-flex items-center justify-center rounded-none font-mono text-sm font-medium transition-colors hover:opacity-90 disabled:pointer-events-none disabled:opacity-50";

/** White pill on dark surfaces. */
export const ctaDashboardOnDarkClassName = `${CTA_DASHBOARD_BASE} border border-white/20 bg-white px-3.5 py-1.5 text-black hover:bg-white/90`;

/** Inverted pill on light surfaces (e.g. vision hero). */
export const ctaDashboardOnLightClassName = `${CTA_DASHBOARD_BASE} border border-foreground/15 bg-foreground px-3.5 py-1.5 text-[#fff8f2] hover:bg-foreground/90`;

export function getCtaDashboardClassName(surface: "light" | "dark"): string {
  return surface === "dark"
    ? ctaDashboardOnDarkClassName
    : ctaDashboardOnLightClassName;
}

/** Cream button — use on dark surfaces. */
export const ctaPrimaryClassName = `${CTA_BASE} border border-[#fff8f2]/30 bg-[#fff8f2] px-4 py-2 text-[#070607] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.4)] hover:border-white hover:bg-white hover:text-[#070607] hover:shadow-[0_0_32px_rgb(255_255_255_/_0.58),0_0_0_1px_rgb(255_255_255_/_0.95),inset_0_1px_0_rgb(255_255_255_/_1)]`;

/** Black button — use on light surfaces. Text always stays cream. */
export const ctaPrimaryOnLightClassName = `${CTA_BASE} border border-[#070607]/15 bg-[#070607] px-4 py-2 text-[#fff8f2] hover:bg-[#070607]/85 hover:text-[#fff8f2]`;

export const ctaSecondaryOnDarkClassName = `${CTA_BASE} border border-white/25 bg-transparent px-4 py-2 text-white/80 hover:border-transparent hover:bg-[#fff8f2] hover:text-[#070607]`;

export const ctaSecondaryOnLightClassName = `${CTA_BASE} border border-[#070607]/30 bg-transparent px-4 py-2 text-[#070607]/80 hover:border-transparent hover:bg-[#070607] hover:text-[#fff8f2]`;

/** Outline CTA that inverts for dashboard light/dark shells. */
export const ctaSecondaryAdaptiveClassName = `${ctaSecondaryOnLightClassName} dark:border-white/25 dark:bg-transparent dark:text-white/80 dark:hover:border-transparent dark:hover:bg-[#fff8f2] dark:hover:text-[#070607]`;

/** Accent deploy CTA — roadmap close, branch terminus. */
export const ctaAccentClassName = `${CTA_BASE} border border-accent/40 bg-accent px-6 py-3 text-sm text-[#070607] hover:bg-accent/90 hover:text-[#070607]`;

/** Frame grey CTA — selective sleek fracture on dark or light sections. */
export const ctaFrameClassName = `${CTA_BASE} border border-[#7b7b73]/40 bg-[#7b7b73] px-4 py-2 text-[#fff8f2] hover:bg-[#6e6e66] hover:text-[#fff8f2]`;

const CTA_TRY_HUMANER_BASE = `${CTA_BASE} gap-2.5 px-5 py-3`;

/** Cream pill — use when floating over dark sections. */
export const ctaTryHumanerOnDarkClassName = `${CTA_TRY_HUMANER_BASE} border border-white/15 bg-[#fff8f2] text-[#070607] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.4)] hover:border-white hover:bg-white hover:text-[#070607] hover:shadow-[0_0_32px_rgb(255_255_255_/_0.58),0_0_0_1px_rgb(255_255_255_/_0.95),inset_0_1px_0_rgb(255_255_255_/_1)]`;

/** Black pill — use when floating over light sections. */
export const ctaTryHumanerOnLightClassName = `${CTA_TRY_HUMANER_BASE} border border-[#070607]/10 bg-[#070607] text-[#fff8f2] hover:bg-[#070607]/90 hover:text-[#fff8f2]`;

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
    ? "flex size-4 shrink-0 items-center justify-center text-[#070607]"
    : "flex size-4 shrink-0 items-center justify-center text-[#e1ccaf]";
}

export const ctaTryHumanerIconClassName = getCtaTryHumanerIconClassName("dark");

const CTA_TRY_HUMANER_LABEL_BASE =
  "font-mono text-xs font-medium uppercase tracking-[0.14em]";

export function getCtaTryHumanerLabelClassName(
  surface: "light" | "dark",
): string {
  return surface === "dark"
    ? `${CTA_TRY_HUMANER_LABEL_BASE} text-[#070607]`
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
