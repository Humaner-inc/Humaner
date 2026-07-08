/**
 * Docs-style developer CTAs — mono, rounded-md.
 *
 * Colors are literal brand neutrals (#070607 / #fff8f2), never theme-relative
 * tokens (`background`/`foreground`). Those tokens flip per app/dark-mode and
 * can end up matching the surface a button sits on, making it disappear.
 *
 * Rule: black button → text stays #fff8f2. Cream/white button → hover shifts
 * to grey, never pure opacity fades (which read as "broken" against dark UI).
 */

export const CTA_BASE =
  'inline-flex items-center justify-center rounded-md font-mono text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50';

/** Pill Dashboard nav CTA — mono, rounded-full (docs / vision topbars). */
export const CTA_DASHBOARD_BASE =
  'inline-flex items-center justify-center rounded-full font-mono text-sm font-medium transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50';

/** White pill on dark surfaces. */
export const ctaDashboardOnDarkClassName = `${CTA_DASHBOARD_BASE} bg-white px-3.5 py-1.5 text-black`;

/** Inverted pill on light surfaces (e.g. vision hero). */
export const ctaDashboardOnLightClassName = `${CTA_DASHBOARD_BASE} bg-foreground px-3.5 py-1.5 text-[#fff8f2]`;

export function getCtaDashboardClassName(surface: 'light' | 'dark'): string {
  return surface === 'dark' ? ctaDashboardOnDarkClassName : ctaDashboardOnLightClassName;
}

/** Cream button — use on dark surfaces. */
export const ctaPrimaryClassName = `${CTA_BASE} bg-[#fff8f2] px-4 py-2 text-[#070607] hover:bg-[#d9d4cd] hover:text-[#070607]`;

/** Black button — use on light surfaces. Text always stays cream. */
export const ctaPrimaryOnLightClassName = `${CTA_BASE} bg-[#070607] px-4 py-2 text-[#fff8f2] hover:bg-[#070607]/85 hover:text-[#fff8f2]`;

export const ctaSecondaryOnDarkClassName = `${CTA_BASE} border border-white/20 bg-white/[0.04] px-4 py-2 text-white/80 hover:border-white/30 hover:bg-white/[0.08] hover:text-white`;

export const ctaSecondaryOnLightClassName = `${CTA_BASE} border border-[#070607]/25 bg-[#070607]/[0.04] px-4 py-2 text-[#070607]/80 hover:border-[#070607]/40 hover:bg-[#070607]/[0.08] hover:text-[#070607]`;

/** Outline CTA that inverts for dashboard light/dark shells. */
export const ctaSecondaryAdaptiveClassName = `${ctaSecondaryOnLightClassName} dark:border-white/20 dark:bg-white/[0.04] dark:text-white/80 dark:hover:border-white/30 dark:hover:bg-white/[0.08] dark:hover:text-white`;

/** Crimson deploy CTA — roadmap close, branch terminus. */
export const ctaAccentClassName = `${CTA_BASE} bg-accent px-6 py-3 text-sm text-[#fff8f2] hover:bg-accent/90 hover:text-[#fff8f2]`;

/**
 * Floating demo dock trigger — the landing page's core CTA.
 * Same language as `ctaPrimaryClassName` (mono, rounded-md) with a crimson
 * glyph and floating-dock elevation. Inverts against the surface behind it:
 * cream pill over dark sections, black pill over light sections.
 */
const CTA_TRY_HUMANER_BASE = `${CTA_BASE} gap-2.5 px-5 py-3`;

/** Cream pill — use when floating over dark sections. */
export const ctaTryHumanerOnDarkClassName = `${CTA_TRY_HUMANER_BASE} bg-[#fff8f2] text-[#070607] hover:bg-[#d9d4cd] hover:text-[#070607] shadow-[0_16px_40px_-12px_rgb(0_0_0_/_0.6),0_0_0_1px_rgb(255_255_255_/_0.08),inset_0_1px_0_rgb(255_255_255_/_0.9)]`;

/** Black pill — use when floating over light sections. */
export const ctaTryHumanerOnLightClassName = `${CTA_TRY_HUMANER_BASE} bg-[#070607] text-[#fff8f2] hover:bg-[#070607]/90 hover:text-[#fff8f2] shadow-[0_16px_40px_-12px_rgb(0_0_0_/_0.35),0_0_0_1px_rgb(7_6_7_/_0.06),inset_0_1px_0_rgb(255_255_255_/_0.12)]`;

export const ctaTryHumanerClassName = ctaTryHumanerOnDarkClassName;

export function getCtaTryHumanerClassName(surface: 'light' | 'dark'): string {
  return surface === 'dark'
    ? ctaTryHumanerOnDarkClassName
    : ctaTryHumanerOnLightClassName;
}

export const ctaTryHumanerIconClassName =
  'flex size-4 shrink-0 items-center justify-center text-[#dc143c]';

const CTA_TRY_HUMANER_LABEL_BASE =
  'font-mono text-xs font-medium uppercase tracking-[0.14em]';

export function getCtaTryHumanerLabelClassName(
  surface: 'light' | 'dark'
): string {
  return surface === 'dark'
    ? `${CTA_TRY_HUMANER_LABEL_BASE} text-[#070607]`
    : `${CTA_TRY_HUMANER_LABEL_BASE} text-[#fff8f2]`;
}

export const ctaTryHumanerLabelClassName =
  getCtaTryHumanerLabelClassName('dark');

export function getBranchTagClassName(
  state: 'active' | 'engaged' | 'idle',
  surface: 'light' | 'dark'
): string {
  if (state === 'active') {
    return surface === 'dark' ? ctaPrimaryClassName : ctaPrimaryOnLightClassName;
  }

  const secondary =
    surface === 'dark' ? ctaSecondaryOnDarkClassName : ctaSecondaryOnLightClassName;

  return state === 'idle' ? `${secondary} opacity-50` : secondary;
}
