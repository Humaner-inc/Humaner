/** Humaner email brand tokens — mirror landing/dashboard CTA + typography. */

export const EMAIL_COLORS = {
  foreground: '#070607',
  background: '#f5f3f0',
  surface: '#fff8f2',
  muted: 'rgba(7, 6, 7, 0.55)',
  border: 'rgba(7, 6, 7, 0.12)',
  accent: '#dc143c',
  link: '#6b2d3a'
} as const;

export const EMAIL_FONTS = {
  /** The Seasons is not web-hosted; Georgia matches the display serif feel. */
  display: "Georgia, 'Times New Roman', Times, serif",
  /** Fellix is not web-hosted in email; system sans mirrors body copy role. */
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
} as const;

/** Matches `ctaPrimaryOnLightClassName` — black mono pill on cream surfaces. */
export const EMAIL_BUTTON_PRIMARY_CLASS =
  'rounded-md bg-[#070607] px-4 py-2.5 text-center text-xs font-medium text-[#fff8f2] no-underline';

export const EMAIL_BODY_CLASS = 'm-auto bg-[#f5f3f0] px-2';

export const EMAIL_CONTAINER_CLASS =
  'mx-auto my-10 max-w-[465px] rounded-md border border-solid border-[#070607]/12 bg-[#fff8f2] p-6';

export const EMAIL_TITLE_CLASS =
  'mx-0 my-6 p-0 text-center text-2xl font-normal tracking-tight text-[#070607]';

export const EMAIL_TEXT_CLASS = 'text-sm leading-relaxed text-[#070607]';

export const EMAIL_MUTED_CLASS = 'text-xs leading-relaxed text-[#070607]/55';

export const EMAIL_LINK_CLASS = 'text-[#6b2d3a] no-underline';

export const EMAIL_HR_CLASS =
  'mx-0 my-6 w-full border border-solid border-[#070607]/12';

export const EMAIL_OTP_CLASS =
  'm-0 text-4xl font-semibold tracking-[0.35em] text-[#070607]';

export const EMAIL_OTP_SLOT_CLASS =
  'size-12 rounded-lg border border-solid border-[#070607]/[0.08] bg-white text-center text-base font-semibold text-[#070607]';

export const EMAIL_EYEBROW_CLASS =
  'm-0 text-[10px] font-medium uppercase tracking-[0.18em] text-[#070607]/45';

export const EMAIL_ONBOARDING_BODY_CLASS = 'm-auto bg-[#070607] px-2';

export const EMAIL_ONBOARDING_CONTAINER_CLASS =
  'mx-auto my-10 max-w-[465px] rounded-2xl border border-solid border-[#070607]/[0.06] bg-[#fff8f2] p-6 shadow-[0_24px_80px_-12px_rgb(0_0_0_/_0.25)]';

export const EMAIL_ONBOARDING_TITLE_CLASS =
  'mx-0 mb-2 mt-0 p-0 text-left text-xl font-semibold tracking-tight text-[#070607]';

export const EMAIL_OR_DIVIDER_CLASS =
  'my-6 flex items-center gap-3 font-mono text-xs text-[#070607]/35';
