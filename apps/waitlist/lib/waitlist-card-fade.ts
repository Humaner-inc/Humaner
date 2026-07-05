/** Page background — mask fade must dissolve into this exactly. */
export const WAITLIST_PAGE_BG = '#070607';

/**
 * Bottom fade mask for belief / feature cards. Solid through ~68% so
 * top-aligned copy stays crisp; the last third eases out smoothly.
 */
export const WAITLIST_CARD_BOTTOM_FADE_MASK =
  'linear-gradient(to bottom, #000 0%, #000 68%, rgb(0 0 0 / 0.82) 82%, rgb(0 0 0 / 0.38) 93%, transparent 100%)';

export const WAITLIST_CARD_RADIUS = '1.75rem';

export const waitlistCardFadeMaskStyle = {
  maskImage: WAITLIST_CARD_BOTTOM_FADE_MASK,
  WebkitMaskImage: WAITLIST_CARD_BOTTOM_FADE_MASK
} as const;
