/**
 * Humaner auth + onboarding design tokens.
 * Auth: dark solid. Onboarding: light card on dark bg (invertible via theme).
 * Body copy uses Fellix (font-sans); labels and CTAs use mono.
 */

import {
  ctaPrimaryClassName,
  ctaSecondaryOnDarkClassName,
  ctaSecondaryOnLightClassName
} from '@humaner/shared/cta';
import {
  uiAuthLabelClassName,
  uiAuthLinkClassName,
  uiAuthMutedClassName,
  uiOnboardingLabelClassName,
  uiOnboardingMutedClassName
} from '@humaner/shared/typography';

// ─── Auth (sign-in / sign-up / verify / etc.) — dark surface ──────────────────

export const authSurfaceClassName =
  'overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c0b0c] text-[#fff8f2]';

export const authInputClassName =
  'auth-input h-11 rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#fff8f2] shadow-none placeholder:text-white/30 selection:bg-[#e1ccaf]/15 selection:text-white focus-visible:border-[#e1ccaf]/40 focus-visible:ring-1 focus-visible:ring-[#e1ccaf]/20';

export const authInputAdornmentClassName = 'text-white/40';

export const authLabelClassName = uiAuthLabelClassName;

export const authLinkClassName = uiAuthLinkClassName;

export const authPrimaryButtonClassName = `${ctaPrimaryClassName} h-11 w-full`;

export const authOutlineButtonClassName = `${ctaSecondaryOnDarkClassName} h-11 w-full hover:!border-transparent hover:!bg-[#fff8f2] hover:!text-[#070607]`;

export const authHighlightButtonClassName = ctaPrimaryClassName;

export const authMutedTextClassName = uiAuthMutedClassName;

export const authDividerClassName =
  'flex items-center gap-x-3 font-mono text-xs text-white/30 before:h-px before:flex-1 before:bg-white/[0.06] after:h-px after:flex-1 after:bg-white/[0.06]';

export const authHeadingClassName =
  'font-display font-semibold tracking-tight text-[#fff8f2]';

export const authPageTitleClassName =
  'font-display text-5xl font-semibold tracking-tight text-[#fff8f2] sm:text-6xl';

export const authDestructiveMessageClassName = 'text-red-400';

export const authAlertDestructiveClassName =
  'border-red-500/20 bg-red-500/[0.06] text-red-300';

export const authLogoClassName =
  'gap-3 [&_img]:h-12 [&_span]:text-2xl [&_span]:text-white sm:[&_img]:h-14 sm:[&_span]:text-3xl';

export const authOnboardingCardClassName =
  'overflow-hidden rounded-2xl border border-[#070607]/[0.06] bg-[#fff8f2] p-5 text-[#070607] shadow-[0_24px_80px_-12px_rgb(0_0_0_/_0.25)] sm:p-6';

/** Dark glass auth card — matches landing navbar dropdown / bento panels. */
export const authGlassCardClassName =
  'relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.03] p-5 text-[#fff8f2] shadow-[0_32px_80px_-20px_rgb(0_0_0_/_0.85),inset_0_1px_0_rgb(255_255_255_/_0.08)] backdrop-blur-3xl backdrop-saturate-150 sm:p-6';

export const authGlassCardGlowClassName =
  'pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgb(255_255_255_/_0.1),transparent_65%)]';

export const authOnboardingHeadingClassName =
  'font-display text-xl font-semibold tracking-tight text-[#070607]';

export const authOnboardingMutedClassName = uiOnboardingMutedClassName;

export const authOnboardingLinkClassName =
  'font-medium text-[#070607] underline underline-offset-4 transition-colors hover:text-[#e1ccaf]';

export const authOnboardingPrimaryButtonClassName = `${ctaPrimaryClassName} h-11 w-full`;

export const authOnboardingOtpSlotClassName =
  'size-12 rounded-lg border border-[#070607]/[0.08] bg-white text-base font-semibold text-[#070607] shadow-none first:rounded-lg first:border last:rounded-lg';

export const authOtpSlotClassName =
  'size-12 rounded-lg border border-white/[0.12] bg-white/[0.04] text-base font-semibold text-[#fff8f2] shadow-none first:rounded-lg first:border last:rounded-lg';

export const authOnboardingDestructiveClassName = 'text-sm text-red-600';

// ─── Onboarding — light card on dark bg (default) ─────────────────────────────
// When theme is inverted: card becomes #070607, bg becomes #fff8f2

export const onboardingSurfaceClassName =
  'overflow-hidden rounded-2xl border border-[#070607]/[0.06] bg-[#fff8f2] text-[#070607] shadow-[0_24px_80px_-12px_rgb(0_0_0_/_0.2)]';

export const onboardingInputClassName =
  'h-10 rounded-lg border border-[#070607]/[0.08] bg-white text-[#070607] text-sm shadow-none placeholder:text-[#070607]/35 selection:bg-[#e1ccaf]/12 selection:text-[#070607] focus-visible:border-[#e1ccaf]/50 focus-visible:ring-1 focus-visible:ring-[#e1ccaf]/20';

export const onboardingLabelClassName = uiOnboardingLabelClassName;

export const onboardingMutedTextClassName = uiOnboardingMutedClassName;

export const onboardingHeadingClassName =
  'font-display font-semibold tracking-tight text-[#070607]';

export const onboardingCardClassName =
  'rounded-lg border border-[#070607]/[0.06] bg-[#070607]/[0.02]';

export const onboardingRadioCardClassName =
  'border border-[#070607]/[0.08] bg-[#070607]/[0.02] py-2.5 pl-3 pr-8 text-left transition-all hover:border-[#070607]/[0.15] hover:bg-[#070607]/[0.04] data-[state=checked]:border-[#e1ccaf]/40 data-[state=checked]:bg-[#e1ccaf]/[0.04] data-[state=checked]:ring-1 data-[state=checked]:ring-[#e1ccaf]/25';

export const onboardingRadioCardCheckClassName =
  'border-[#070607]/15 bg-[#070607]/[0.02] group-data-[state=checked]:border-[#e1ccaf] group-data-[state=checked]:bg-[#e1ccaf]';

/** Mirror of onboarding radio cards for inverted (dark card) appearance */
export const onboardingRadioCardClassNameInverted =
  'border border-white/[0.08] bg-white/[0.04] py-2.5 pl-3 pr-8 text-left transition-all hover:border-white/[0.15] hover:bg-white/[0.06] data-[state=checked]:border-[#e1ccaf]/40 data-[state=checked]:bg-[#e1ccaf]/[0.04] data-[state=checked]:ring-1 data-[state=checked]:ring-[#e1ccaf]/25';

export const onboardingRadioCardCheckClassNameInverted =
  'border-white/15 bg-white/[0.04] group-data-[state=checked]:border-[#e1ccaf] group-data-[state=checked]:bg-[#e1ccaf]';

export const onboardingOutlineButtonClassName = `${ctaSecondaryOnLightClassName} h-10 px-4`;

export const onboardingOutlineButtonClassNameInverted = `${ctaSecondaryOnDarkClassName} h-10 px-4`;

export const onboardingGhostButtonClassName =
  'text-[#070607]/60 hover:bg-[#070607]/[0.04] hover:text-[#070607]';

export const onboardingGhostButtonClassNameInverted =
  'text-white/60 hover:bg-white/[0.04] hover:text-[#fff8f2]';

// ─── Auth inner card (nested content — no extra wrapper) ──────────────────────

export const authInnerCardClassName =
  'rounded-none border-0 bg-transparent text-[#fff8f2] shadow-none';

export const authInnerCardHeaderClassName = 'space-y-1.5 p-0';

export const authInnerCardContentClassName = 'p-0';

export const authInnerCardFooterClassName = 'p-0 pt-4';

export const authInnerCardTitleClassName =
  'font-display text-xl font-semibold leading-none tracking-tight text-[#fff8f2]';

export const authInnerCardDescriptionClassName = authMutedTextClassName;

export const authInnerHighlightClassName =
  'flex flex-col items-center space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4';

// ─── Legacy aliases (backward compatibility) ──────────────────────────────────

export const glassSurfaceClassName = authSurfaceClassName;
export const glassSurfaceCompactClassName = onboardingSurfaceClassName;
export const glassInputClassName = authInputClassName;
export const glassInputCompactClassName = onboardingInputClassName;
export const glassInputAdornmentClassName = authInputAdornmentClassName;
export const glassLabelClassName = onboardingLabelClassName;
export const glassLinkClassName = authLinkClassName;
export const glassPrimaryButtonClassName = authPrimaryButtonClassName;
export const glassOutlineButtonClassName = authOutlineButtonClassName;
export const glassHighlightButtonClassName = authHighlightButtonClassName;
export const glassMutedTextClassName = onboardingMutedTextClassName;
export const glassDividerClassName = authDividerClassName;
export const glassHeadingClassName = onboardingHeadingClassName;
export const glassDestructiveMessageClassName = authDestructiveMessageClassName;
export const glassAlertDestructiveClassName = authAlertDestructiveClassName;
export const glassGhostButtonClassName = onboardingGhostButtonClassName;
export const glassCardClassName = onboardingCardClassName;
export const glassSegmentSelectedClassName =
  'border-[#e1ccaf]/40 bg-[#e1ccaf]/[0.06] ring-1 ring-[#e1ccaf]/25';
export const glassSegmentUnselectedClassName =
  'border-[#070607]/[0.06] bg-white hover:bg-[#070607]/[0.02]';
export const glassRadioCardClassName = onboardingRadioCardClassName;
export const glassRadioCardCheckClassName = onboardingRadioCardCheckClassName;
export const glassLogoClassName = authLogoClassName;
export const glassOutlineButtonCompactClassName =
  onboardingOutlineButtonClassName;

export const authSurfaceCompactClassName = onboardingSurfaceClassName;
export const authInputCompactClassName = onboardingInputClassName;
export const authCardClassName = onboardingCardClassName;
export const authGhostButtonClassName = onboardingGhostButtonClassName;
