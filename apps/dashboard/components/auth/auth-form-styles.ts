/**
 * Auth + onboarding design tokens — Humaner cream / dark fracture.
 * Self-Host keeps feature/content splits elsewhere; brand chrome is shared.
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

/** Always Humaner visual kit. */
const oss = false;

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authSurfaceClassName = oss
  ? 'overflow-hidden rounded-xl border border-border bg-muted/20 text-card-foreground shadow-sm'
  : 'overflow-hidden rounded-2xl border border-white/[0.06] bg-muted/20 text-[#fcf4ec]';

export const authInputClassName = oss
  ? 'h-10 rounded-[0.5rem] border border-[#eaeaea] bg-white text-[#0A0D0D] shadow-none placeholder:text-[#18181b]/45 selection:bg-[#0A0D0D]/15 selection:text-[#0A0D0D] focus-visible:border-[#0A0D0D] focus-visible:ring-1 focus-visible:ring-[#0A0D0D]/20'
  : 'auth-input h-11 rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#fcf4ec] shadow-none placeholder:text-white/30 selection:bg-[#e0e1df]/15 selection:text-white focus-visible:border-[#e0e1df]/40 focus-visible:ring-1 focus-visible:ring-[#e0e1df]/20';

export const authInputAdornmentClassName = oss
  ? 'text-[#18181b]/55'
  : 'text-white/40';

export const authLabelClassName = oss
  ? 'text-sm font-medium text-[#0A0D0D]'
  : uiAuthLabelClassName;

export const authLinkClassName = oss
  ? 'text-sm font-medium text-[#0A0D0D] underline underline-offset-4 hover:text-[#18181b]'
  : uiAuthLinkClassName;

export const authPrimaryButtonClassName = oss
  ? 'inline-flex h-10 w-full items-center justify-center rounded-[0.5rem] bg-[#0A0D0D] px-4 font-sans text-sm font-medium normal-case text-white transition-colors hover:bg-[#1c1c1e]'
  : `${ctaPrimaryClassName} h-11 w-full`;

export const authOutlineButtonClassName = oss
  ? 'inline-flex h-10 w-full items-center justify-center gap-2 rounded-[0.5rem] border border-[#eaeaea] bg-white px-4 font-sans text-sm font-medium normal-case text-[#0A0D0D] transition-colors hover:border-[#0A0D0D] hover:bg-[#18181b] hover:text-white'
  : `${ctaSecondaryOnDarkClassName} h-11 w-full`;

export const authHighlightButtonClassName = oss
  ? 'inline-flex h-10 w-full items-center justify-center rounded-[0.5rem] bg-[#0A0D0D] px-4 font-sans text-sm font-medium normal-case text-white transition-colors hover:bg-[#1c1c1e]'
  : ctaPrimaryClassName;

export const authMutedTextClassName = oss
  ? 'text-sm text-[#18181b]/70'
  : uiAuthMutedClassName;

export const authDividerClassName = oss
  ? 'flex items-center gap-x-3 text-xs text-[#18181b]/55 before:h-px before:flex-1 before:bg-[#eaeaea] after:h-px after:flex-1 after:bg-[#eaeaea]'
  : 'flex items-center gap-x-3 font-info text-xs text-white/30 before:h-px before:flex-1 before:bg-white/[0.06] after:h-px after:flex-1 after:bg-white/[0.06]';

export const authHeadingClassName = oss
  ? 'text-xl font-normal tracking-tight text-[#0A0D0D]'
  : 'font-display font-normal tracking-tight text-[#fcf4ec]';

export const authPageTitleClassName = oss
  ? 'text-2xl font-normal tracking-tight text-[#0A0D0D]'
  : 'font-display text-5xl font-normal tracking-tight text-[#fcf4ec] sm:text-6xl';

export const authEyebrowClassName = oss
  ? 'font-info text-[11px] uppercase tracking-[0.22em] text-[#18181b]/55'
  : 'font-info text-[11px] uppercase tracking-[0.22em] text-[#e0e1df]/80';

export const authDestructiveMessageClassName = oss
  ? 'text-sm text-destructive'
  : 'text-red-400';

export const authAlertDestructiveClassName = oss
  ? 'border-destructive/30 bg-destructive/10 text-destructive'
  : 'border-red-500/20 bg-red-500/[0.06] text-red-300';

export const authLogoClassName = oss
  ? 'gap-3 [&_span]:text-2xl [&_span]:text-[#0A0D0D] sm:[&_span]:text-3xl'
  : 'gap-3 [&_img]:h-12 [&_span]:text-2xl [&_span]:text-white sm:[&_img]:h-14 sm:[&_span]:text-3xl';

export const authOnboardingCardClassName = oss
  ? 'overflow-hidden rounded-xl border border-border bg-muted/20 p-5 text-card-foreground shadow-sm sm:p-6'
  : 'overflow-hidden rounded-2xl border border-[#0A0D0D]/[0.06] bg-[#fcf4ec] p-5 text-[#0A0D0D] shadow-[0_24px_80px_-12px_rgb(0_0_0_/_0.25)] sm:p-6';

/** Dark glass auth card — Cloud only look; OSS uses a plain card. */
export const authGlassCardClassName = oss
  ? 'relative overflow-hidden rounded-xl border border-border bg-muted/20 p-5 text-card-foreground shadow-sm sm:p-6'
  : 'relative overflow-hidden rounded-2xl border border-white/[0.12] bg-muted/20 p-5 text-[#fcf4ec] shadow-[0_32px_80px_-20px_rgb(0_0_0_/_0.85),inset_0_1px_0_rgb(255_255_255_/_0.08)] sm:p-6';

export const authGlassCardGlowClassName = oss
  ? 'hidden'
  : 'pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgb(255_255_255_/_0.1),transparent_65%)]';

export const authOnboardingHeadingClassName = oss
  ? 'text-xl font-semibold tracking-tight text-foreground'
  : 'font-display text-xl font-normal tracking-tight text-[#0A0D0D]';

export const authOnboardingMutedClassName = oss
  ? 'text-sm text-muted-foreground'
  : uiOnboardingMutedClassName;

export const authOnboardingLinkClassName = oss
  ? 'font-medium text-foreground underline underline-offset-4'
  : 'font-medium text-[#0A0D0D] underline underline-offset-4 transition-colors hover:text-[#e0e1df]';

export const authOnboardingPrimaryButtonClassName = oss
  ? authPrimaryButtonClassName
  : `${ctaPrimaryClassName} h-11 w-full`;

export const authOnboardingOtpSlotClassName = oss
  ? 'size-12 rounded-[0.5rem] border border-[#eaeaea] bg-white text-base font-semibold text-[#0A0D0D] shadow-none first:rounded-[0.5rem] last:rounded-[0.5rem]'
  : 'size-12 rounded-lg border border-[#0A0D0D]/[0.08] bg-white text-base font-semibold text-[#0A0D0D] shadow-none first:rounded-lg first:border last:rounded-lg';

export const authOtpSlotClassName = oss
  ? 'size-12 rounded-[0.5rem] border border-[#eaeaea] bg-white text-base font-semibold text-[#0A0D0D] shadow-none first:rounded-[0.5rem] last:rounded-[0.5rem]'
  : 'size-12 rounded-lg border border-white/[0.12] bg-white/[0.04] text-base font-semibold text-[#fcf4ec] shadow-none first:rounded-lg first:border last:rounded-lg';

/** Focus ring tint applied alongside slot classes (Cloud cream / OSS zinc). */
export const authOtpSlotRingClassName = oss
  ? 'ring-[#0A0D0D]/20'
  : 'ring-[#e0e1df]/40';

export const authOnboardingDestructiveClassName = oss
  ? 'text-sm text-destructive'
  : 'text-sm text-red-600';

// ─── Onboarding ───────────────────────────────────────────────────────────────

export const onboardingSurfaceClassName = oss
  ? 'overflow-hidden rounded-xl border border-border bg-muted/20 text-card-foreground shadow-sm'
  : 'overflow-hidden rounded-2xl border border-[#0A0D0D]/[0.06] bg-[#fcf4ec] text-[#0A0D0D] shadow-[0_24px_80px_-12px_rgb(0_0_0_/_0.2)]';

export const onboardingInputClassName = oss
  ? authInputClassName
  : 'h-10 rounded-lg border border-[#0A0D0D]/[0.08] bg-white text-[#0A0D0D] text-sm shadow-none placeholder:text-[#0A0D0D]/35 selection:bg-[#e0e1df]/12 selection:text-[#0A0D0D] focus-visible:border-[#e0e1df]/50 focus-visible:ring-1 focus-visible:ring-[#e0e1df]/20';

export const onboardingLabelClassName = oss
  ? authLabelClassName
  : uiOnboardingLabelClassName;

export const onboardingMutedTextClassName = oss
  ? authMutedTextClassName
  : uiOnboardingMutedClassName;

export const onboardingHeadingClassName = oss
  ? 'text-lg font-semibold tracking-tight text-foreground'
  : 'font-display font-normal tracking-tight text-[#0A0D0D]';

export const onboardingCardClassName = oss
  ? 'border border-border bg-muted/40'
  : 'border border-[#0A0D0D]/[0.06] bg-[#0A0D0D]/[0.02]';

export const onboardingRadioCardClassName = oss
  ? 'rounded-[0.5rem] border border-border bg-background py-2.5 pl-3 pr-8 text-left transition-all hover:bg-accent data-[state=checked]:border-primary data-[state=checked]:ring-1 data-[state=checked]:ring-ring'
  : 'rounded-lg border border-[#0A0D0D]/[0.08] bg-[#0A0D0D]/[0.02] py-2.5 pl-3 pr-8 text-left transition-all hover:border-[#0A0D0D]/[0.15] hover:bg-[#0A0D0D]/[0.04] data-[state=checked]:border-[#e0e1df]/40 data-[state=checked]:bg-[#e0e1df]/[0.04] data-[state=checked]:ring-1 data-[state=checked]:ring-[#e0e1df]/25';

export const onboardingRadioCardCheckClassName = oss
  ? 'rounded-[0.25rem] border-input bg-background group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary'
  : 'rounded-[3px] border-[#0A0D0D]/15 bg-[#0A0D0D]/[0.02] group-data-[state=checked]:border-[#e0e1df] group-data-[state=checked]:bg-[#e0e1df]';

export const onboardingRadioCardClassNameInverted = oss
  ? onboardingRadioCardClassName
  : 'rounded-lg border border-white/[0.08] bg-white/[0.04] py-2.5 pl-3 pr-8 text-left transition-all hover:border-white/[0.15] hover:bg-white/[0.06] data-[state=checked]:border-[#e0e1df]/40 data-[state=checked]:bg-[#e0e1df]/[0.04] data-[state=checked]:ring-1 data-[state=checked]:ring-[#e0e1df]/25';

export const onboardingRadioCardCheckClassNameInverted = oss
  ? onboardingRadioCardCheckClassName
  : 'rounded-[3px] border-white/15 bg-white/[0.04] group-data-[state=checked]:border-[#e0e1df] group-data-[state=checked]:bg-[#e0e1df]';

export const onboardingOutlineButtonClassName = oss
  ? authOutlineButtonClassName
  : `${ctaSecondaryOnLightClassName} h-10 px-4`;

export const onboardingOutlineButtonClassNameInverted = oss
  ? authOutlineButtonClassName
  : `${ctaSecondaryOnDarkClassName} h-10 px-4`;

export const onboardingGhostButtonClassName = oss
  ? 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
  : 'text-[#0A0D0D]/60 hover:bg-[#0A0D0D]/[0.04] hover:text-[#0A0D0D]';

export const onboardingGhostButtonClassNameInverted = oss
  ? onboardingGhostButtonClassName
  : 'text-white/60 hover:bg-white/[0.04] hover:text-[#fcf4ec]';

export const authInnerCardClassName = oss
  ? 'rounded-md border-0 bg-transparent text-foreground shadow-none'
  : 'rounded-lg border-0 bg-transparent text-[#fcf4ec] shadow-none';

export const authInnerCardHeaderClassName = 'space-y-1.5 p-0';

export const authInnerCardContentClassName = 'p-0';

export const authInnerCardFooterClassName = 'p-0 pt-4';

export const authInnerCardTitleClassName = oss
  ? 'text-xl font-normal leading-none tracking-tight text-foreground'
  : 'font-display text-xl font-normal leading-none tracking-tight text-[#fcf4ec]';

export const authInnerCardDescriptionClassName = authMutedTextClassName;

export const authInnerHighlightClassName = oss
  ? 'flex flex-col items-center space-y-2 rounded-lg border border-border bg-muted/40 p-4'
  : 'flex flex-col items-center space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4';

// ─── Legacy aliases ───────────────────────────────────────────────────────────

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
export const glassSegmentSelectedClassName = oss
  ? 'border-primary/40 bg-primary/5 ring-1 ring-ring'
  : 'border-[#e0e1df]/40 bg-[#e0e1df]/[0.06] ring-1 ring-[#e0e1df]/25';
export const glassSegmentUnselectedClassName = oss
  ? 'border-border bg-background hover:bg-muted/50'
  : 'border-[#0A0D0D]/[0.06] bg-white hover:bg-[#0A0D0D]/[0.02]';
export const glassRadioCardClassName = onboardingRadioCardClassName;
export const glassRadioCardCheckClassName = onboardingRadioCardCheckClassName;
export const glassLogoClassName = authLogoClassName;
export const glassOutlineButtonCompactClassName =
  onboardingOutlineButtonClassName;

export const authSurfaceCompactClassName = onboardingSurfaceClassName;
export const authInputCompactClassName = onboardingInputClassName;
export const authCardClassName = onboardingCardClassName;
export const authGhostButtonClassName = onboardingGhostButtonClassName;
