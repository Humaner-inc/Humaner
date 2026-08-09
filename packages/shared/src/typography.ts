/**
 * Humaner type system — mix fonts by purpose.
 *
 * Fellix (`font-sans`): body text, descriptions, features, tabs
 * The Seasons (`font-display`): main titles and section headlines
 * Mono (`font-mono`): code, docs labels/nav, numbers, CTAs, pricing
 *   messages/agents/members, and specific data mentions (agent counts, etc.)
 *
 * Fellix (`font-fellix`): product mockups / embeddable widget — same face as sans
 */

export const UI_SANS = "font-sans";
export const UI_DISPLAY = "font-display";
export const UI_MONO = "font-mono";

export const uiNavLinkClassName = `${UI_SANS} text-xs transition-colors`;

export const uiNavLinkOnLightClassName = `${uiNavLinkClassName} text-foreground/60 hover:text-foreground`;

export const uiNavLinkOnDarkClassName = `${uiNavLinkClassName} text-white/70 hover:text-white`;

export const uiFooterGroupClassName = `${UI_MONO} text-[10px] font-medium uppercase tracking-[0.18em] text-background/40`;

export const uiFooterLinkClassName = `${UI_SANS} text-xs text-background/65 underline-offset-4 transition-colors hover:text-background hover:underline`;

export const uiFooterMetaClassName = `${UI_MONO} text-xs text-background/40`;

export const uiLabelClassName = `${UI_MONO} text-[10px] font-medium uppercase tracking-[0.18em]`;

export const uiMetaClassName = `${UI_MONO} text-xs`;

export const uiBodyClassName = `${UI_SANS} text-sm leading-relaxed`;

export const uiLeadClassName = `${UI_SANS} text-base leading-relaxed`;

export const uiTabClassName = `${UI_SANS} text-sm font-medium`;

/** Long-form prose (docs articles, handbook, legal). */
export const uiLongFormClassName = `${UI_SANS} font-normal text-[15px] leading-[1.8] tracking-[0.01em]`;

export const uiSectionEyebrowOnDarkClassName = `${UI_MONO} text-[10px] font-medium uppercase tracking-[0.18em] text-background/45`;

export const uiSectionEyebrowOnLightClassName = `${UI_MONO} text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/45`;

export const uiAuthLabelClassName = `${UI_MONO} text-[10px] font-medium uppercase tracking-[0.14em] text-white/60`;

export const uiAuthLinkClassName = `${UI_SANS} text-xs text-white/50 underline underline-offset-4 transition-colors hover:text-white/90`;

export const uiAuthMutedClassName = `${UI_SANS} text-xs text-white/50`;

export const uiOnboardingLabelClassName = `${UI_MONO} text-[10px] font-medium uppercase tracking-[0.14em] text-[#0A0D0D]/65`;

export const uiOnboardingMutedClassName = `${uiBodyClassName} text-[#0A0D0D]/50`;

/** Pricing / stats row values (messages, agents, members, counts). */
export const uiStatValueClassName = `${UI_MONO} tabular-nums`;
