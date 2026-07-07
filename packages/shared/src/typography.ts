/**
 * Humaner type system — display for headlines, mono for UI + marketing copy.
 *
 * Display (The Seasons): page titles, section headlines
 * Mono (JetBrains): nav, footer, labels, body copy, descriptions, CTAs — the
 *   default `font-sans` everywhere except long-form reading
 * Fellix (`font-fellix`, opt-in): product mockups / the embeddable widget —
 *   never marketing UI
 *
 * Mono at small sizes gets tiring past ~250 words of continuous prose (docs
 * articles, /vision). For those surfaces use `uiLongFormClassName`: still
 * mono (never switch families mid-app), but lighter weight + roomier leading
 * so long paragraphs stay easy to read.
 */

export const UI_MONO = 'font-mono';

export const uiNavLinkClassName = `${UI_MONO} text-xs transition-colors`;

export const uiNavLinkOnLightClassName = `${uiNavLinkClassName} text-foreground/60 hover:text-foreground`;

export const uiNavLinkOnDarkClassName = `${uiNavLinkClassName} text-white/70 hover:text-white`;

export const uiFooterGroupClassName = `${UI_MONO} text-[10px] font-medium uppercase tracking-[0.18em] text-background/40`;

export const uiFooterLinkClassName = `${UI_MONO} text-xs text-background/65 transition-colors hover:text-background`;

export const uiFooterMetaClassName = `${UI_MONO} text-xs text-background/40`;

export const uiLabelClassName = `${UI_MONO} text-[10px] font-medium uppercase tracking-[0.18em]`;

export const uiMetaClassName = `${UI_MONO} text-xs`;

export const uiBodyClassName = 'font-sans text-sm leading-relaxed';

export const uiLeadClassName = 'font-sans text-base leading-relaxed';

/** Long-form prose (docs articles, /vision, anything past ~250 words). */
export const uiLongFormClassName = `${UI_MONO} font-normal text-[15px] leading-[1.8] tracking-[0.01em]`;

export const uiSectionEyebrowOnDarkClassName = `${UI_MONO} text-[10px] font-medium uppercase tracking-[0.18em] text-background/45`;

export const uiSectionEyebrowOnLightClassName = `${UI_MONO} text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/45`;

export const uiAuthLabelClassName = `${UI_MONO} text-[10px] font-medium uppercase tracking-[0.14em] text-white/60`;

export const uiAuthLinkClassName = `${UI_MONO} text-xs text-white/50 underline underline-offset-4 transition-colors hover:text-white/90`;

export const uiAuthMutedClassName = `${UI_MONO} text-xs text-white/50`;

export const uiOnboardingLabelClassName = `${UI_MONO} text-[10px] font-medium uppercase tracking-[0.14em] text-[#070607]/65`;

export const uiOnboardingMutedClassName = `${uiBodyClassName} text-[#070607]/50`;
