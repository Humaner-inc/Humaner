/**
 * Humaner auth + onboarding design tokens.
 * Auth: dark solid. Onboarding: light card on dark bg (invertible via theme).
 */

// ─── Auth (sign-in / sign-up / verify / etc.) — dark surface ──────────────────

export const authSurfaceClassName =
  'overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c0b0c] text-[#f5f5f5]';

export const authInputClassName =
  'auth-input h-11 rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#f5f5f5] shadow-none placeholder:text-white/30 selection:bg-[#dc143c]/15 selection:text-white focus-visible:border-[#dc143c]/40 focus-visible:ring-1 focus-visible:ring-[#dc143c]/20';

export const authInputAdornmentClassName = 'text-white/40';

export const authLabelClassName = 'text-sm font-normal text-white/70';

export const authLinkClassName =
  'text-sm text-white/50 underline-offset-4 transition-colors hover:text-white/90';

export const authPrimaryButtonClassName =
  'h-11 w-full rounded-lg border-0 bg-[#dc143c] font-medium text-white shadow-[0_0_20px_-4px_rgb(220_20_60_/_0.4)] transition-all hover:bg-[#dc143c]/90 hover:shadow-[0_0_28px_-4px_rgb(220_20_60_/_0.5)]';

export const authOutlineButtonClassName =
  'h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.02] text-[#f5f5f5] transition-all hover:border-[#f5f5f5] hover:bg-[#f5f5f5] hover:text-[#070607]';

export const authHighlightButtonClassName =
  'h-11 w-full rounded-lg border-0 bg-white font-medium text-[#070607] shadow-[0_2px_12px_-2px_rgb(255_255_255_/_0.1)] transition-all hover:bg-white/90';

export const authMutedTextClassName = 'text-sm text-white/50';

export const authDividerClassName =
  'flex items-center gap-x-3 text-sm text-white/30 before:h-px before:flex-1 before:bg-white/[0.06] after:h-px after:flex-1 after:bg-white/[0.06]';

export const authHeadingClassName =
  'font-display font-semibold tracking-tight text-[#f5f5f5]';

export const authPageTitleClassName =
  'font-display text-5xl font-semibold tracking-tight text-[#f5f5f5] sm:text-6xl';

export const authDestructiveMessageClassName = 'text-red-400';

export const authAlertDestructiveClassName =
  'border-red-500/20 bg-red-500/[0.06] text-red-300';

export const authLogoClassName =
  'gap-3 [&_img]:h-12 [&_span]:text-2xl [&_span]:text-white sm:[&_img]:h-14 sm:[&_span]:text-3xl';

export const authOnboardingCardClassName =
  'overflow-hidden rounded-2xl border border-[#070607]/[0.06] bg-[#f5f5f5] p-5 text-[#070607] shadow-[0_24px_80px_-12px_rgb(0_0_0_/_0.25)] sm:p-6';

export const authOnboardingHeadingClassName =
  'font-display text-xl font-semibold tracking-tight text-[#070607]';

export const authOnboardingMutedClassName = 'text-sm leading-relaxed text-[#070607]/50';

export const authOnboardingLinkClassName =
  'font-medium text-[#070607] underline underline-offset-4 transition-colors hover:text-[#dc143c]';

export const authOnboardingPrimaryButtonClassName =
  'h-11 w-full rounded-lg border-0 bg-[#070607] font-medium text-[#f5f5f5] shadow-sm transition-all hover:bg-[#070607]/90 dark:bg-[#070607] dark:text-[#f5f5f5] dark:hover:bg-[#070607]/90';

export const authOnboardingOtpSlotClassName =
  'size-12 rounded-lg border border-[#070607]/[0.08] bg-white text-base font-semibold text-[#070607] shadow-none first:rounded-lg first:border last:rounded-lg';

export const authOnboardingDestructiveClassName = 'text-sm text-red-600';

// ─── Onboarding — light card on dark bg (default) ─────────────────────────────
// When theme is inverted: card becomes #070607, bg becomes #f5f5f5

export const onboardingSurfaceClassName =
  'overflow-hidden rounded-2xl border border-[#070607]/[0.06] bg-[#f5f5f5] text-[#070607] shadow-[0_24px_80px_-12px_rgb(0_0_0_/_0.2)]';

export const onboardingInputClassName =
  'h-10 rounded-lg border border-[#070607]/[0.08] bg-white text-[#070607] text-sm shadow-none placeholder:text-[#070607]/35 selection:bg-[#dc143c]/12 selection:text-[#070607] focus-visible:border-[#dc143c]/50 focus-visible:ring-1 focus-visible:ring-[#dc143c]/20';

export const onboardingLabelClassName = 'text-sm font-medium text-[#070607]/80';

export const onboardingMutedTextClassName = 'text-sm text-[#070607]/50';

export const onboardingHeadingClassName =
  'font-display font-semibold tracking-tight text-[#070607]';

export const onboardingCardClassName =
  'rounded-lg border border-[#070607]/[0.06] bg-[#070607]/[0.02]';

export const onboardingRadioCardClassName =
  'border border-[#070607]/[0.08] bg-white py-2.5 pl-3 pr-8 text-left transition-all hover:border-[#070607]/[0.15] hover:bg-[#070607]/[0.02] data-[state=checked]:border-[#dc143c]/40 data-[state=checked]:bg-[#dc143c]/[0.04] data-[state=checked]:ring-1 data-[state=checked]:ring-[#dc143c]/25';

export const onboardingRadioCardCheckClassName =
  'border-[#070607]/15 bg-white group-data-[state=checked]:border-[#dc143c] group-data-[state=checked]:bg-[#dc143c]';

/** Mirror of onboarding radio cards for inverted (dark card) appearance */
export const onboardingRadioCardClassNameInverted =
  'border border-white/[0.08] bg-white/[0.04] py-2.5 pl-3 pr-8 text-left transition-all hover:border-white/[0.15] hover:bg-white/[0.06] data-[state=checked]:border-[#dc143c]/40 data-[state=checked]:bg-[#dc143c]/[0.04] data-[state=checked]:ring-1 data-[state=checked]:ring-[#dc143c]/25';

export const onboardingRadioCardCheckClassNameInverted =
  'border-white/15 bg-white/[0.04] group-data-[state=checked]:border-[#dc143c] group-data-[state=checked]:bg-[#dc143c]';

export const onboardingOutlineButtonClassName =
  'border border-[#070607]/[0.08] bg-white text-[#070607]/70 hover:border-[#070607]/[0.15] hover:bg-[#070607]/[0.02] hover:text-[#070607]';

export const onboardingOutlineButtonClassNameInverted =
  'border border-white/[0.08] bg-white/[0.04] text-[#f5f5f5]/70 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-[#f5f5f5]';

export const onboardingGhostButtonClassName =
  'text-[#070607]/60 hover:bg-[#070607]/[0.04] hover:text-[#070607]';

export const onboardingGhostButtonClassNameInverted =
  'text-white/60 hover:bg-white/[0.04] hover:text-[#f5f5f5]';

// ─── Auth inner card (nested content — no extra wrapper) ──────────────────────

export const authInnerCardClassName =
  'rounded-none border-0 bg-transparent text-[#f5f5f5] shadow-none';

export const authInnerCardHeaderClassName = 'space-y-1.5 p-0';

export const authInnerCardContentClassName = 'p-0';

export const authInnerCardFooterClassName = 'p-0 pt-4';

export const authInnerCardTitleClassName =
  'font-display text-xl font-semibold leading-none tracking-tight text-[#f5f5f5]';

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
  'border-[#dc143c]/40 bg-[#dc143c]/[0.06] ring-1 ring-[#dc143c]/25';
export const glassSegmentUnselectedClassName =
  'border-[#070607]/[0.06] bg-white hover:bg-[#070607]/[0.02]';
export const glassRadioCardClassName = onboardingRadioCardClassName;
export const glassRadioCardCheckClassName = onboardingRadioCardCheckClassName;
export const glassLogoClassName = authLogoClassName;
export const glassOutlineButtonCompactClassName = onboardingOutlineButtonClassName;

export const authSurfaceCompactClassName = onboardingSurfaceClassName;
export const authInputCompactClassName = onboardingInputClassName;
export const authCardClassName = onboardingCardClassName;
export const authGhostButtonClassName = onboardingGhostButtonClassName;
