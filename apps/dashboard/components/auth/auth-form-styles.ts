/** Light frosted glass (#f5f5f5) with dark foreground — shared by auth + onboarding. */

export const glassSurfaceClassName =
  'overflow-hidden rounded-[2rem] border border-[#070607]/10 bg-[#f5f5f5]/72 shadow-[0_40px_100px_-30px_rgb(0_0_0_/_0.18)] backdrop-blur-2xl text-[#070607]';

export const glassSurfaceCompactClassName =
  'rounded-[1.75rem] border border-[#070607]/10 bg-[#f5f5f5]/72 shadow-[0_40px_100px_-30px_rgb(0_0_0_/_0.18)] backdrop-blur-2xl text-[#070607]';

export const glassInputClassName =
  'h-11 rounded-xl border-[#070607]/15 bg-white/55 text-[#070607] shadow-none placeholder:text-[#070607]/40 focus-visible:border-[#070607]/30 focus-visible:ring-[#070607]/15';

export const glassInputCompactClassName =
  'h-9 rounded-md border-[#070607]/15 bg-white/55 text-sm text-[#070607] placeholder:text-[#070607]/40 focus-visible:border-[#070607]/30 focus-visible:ring-[#070607]/15';

export const glassInputAdornmentClassName = 'text-[#070607]/50';

export const glassLabelClassName = 'text-sm font-normal text-[#070607]/90';

export const glassLinkClassName =
  'text-sm text-[#070607]/75 underline-offset-4 hover:text-[#070607]';

export const glassPrimaryButtonClassName =
  'h-11 w-full rounded-xl !border-0 bg-[#f5f5f5] text-[#070607] shadow-none hover:!bg-white hover:!text-[#070607]';

export const glassOutlineButtonClassName =
  'h-11 w-full rounded-xl !border-0 bg-white/40 text-[#070607] hover:!bg-white/60 hover:!text-[#070607]';

export const glassHighlightButtonClassName =
  'h-11 w-full rounded-xl !border-0 bg-white font-medium text-[#070607] shadow-[0_8px_24px_-8px_rgb(0_0_0_/_0.15)] hover:!bg-white/90 hover:!text-[#070607]';

export const glassMutedTextClassName = 'text-sm text-[#070607]/65';

export const glassDividerClassName =
  'flex items-center gap-x-3 text-sm text-[#070607]/50 before:h-px before:flex-1 before:bg-[#070607]/12 after:h-px after:flex-1 after:bg-[#070607]/12';

export const glassHeadingClassName =
  'font-display font-semibold tracking-tight text-[#070607]';

export const glassDestructiveMessageClassName = 'text-red-600';

export const glassAlertDestructiveClassName =
  'border-red-300/80 bg-red-50/90 text-red-800';

export const glassOutlineButtonCompactClassName =
  'border-[#070607]/18 bg-white/45 text-[#070607] hover:bg-white/70 hover:text-[#070607]';

export const glassGhostButtonClassName =
  'text-[#070607]/70 hover:bg-white/50 hover:text-[#070607]';

export const glassCardClassName =
  'rounded-lg border border-[#070607]/12 bg-white/40';

/** Nested content inside AuthContainer — no second opaque card shell. */
export const authInnerCardClassName =
  'rounded-none border-0 bg-transparent text-[#070607] shadow-none';

export const authInnerCardHeaderClassName = 'space-y-1.5 p-0';

export const authInnerCardContentClassName = 'p-0';

export const authInnerCardFooterClassName = 'p-0 pt-4';

export const authInnerCardTitleClassName =
  'font-display text-xl font-semibold leading-none tracking-tight text-[#070607]';

export const authInnerCardDescriptionClassName = glassMutedTextClassName;

export const authInnerHighlightClassName =
  'flex flex-col items-center space-y-2 rounded-xl p-4 ' + glassCardClassName;

export const glassSegmentSelectedClassName =
  'border-[#070607]/25 bg-white/70 ring-1 ring-[#070607]/15';

export const glassSegmentUnselectedClassName =
  'border-[#070607]/12 bg-white/35 hover:border-[#070607]/20 hover:bg-white/55';

export const glassRadioCardClassName =
  'border-[#070607]/15 bg-white/35 py-2.5 pl-3 pr-8 text-left hover:border-[#070607]/25 data-[state=checked]:border-[#070607]/30 data-[state=checked]:bg-white/60';

export const glassLogoClassName =
  'gap-3 [&_img]:h-12 [&_span]:text-2xl [&_span]:text-[#070607] sm:[&_img]:h-14 sm:[&_span]:text-3xl';

export const authInputClassName = glassInputClassName;
export const authInputAdornmentClassName = glassInputAdornmentClassName;
export const authLabelClassName = glassLabelClassName;
export const authLinkClassName = glassLinkClassName;
export const authPrimaryButtonClassName = glassPrimaryButtonClassName;
export const authOutlineButtonClassName = glassOutlineButtonClassName;
export const authMutedTextClassName = glassMutedTextClassName;
export const authDividerClassName = glassDividerClassName;
export const authHighlightButtonClassName = glassHighlightButtonClassName;
