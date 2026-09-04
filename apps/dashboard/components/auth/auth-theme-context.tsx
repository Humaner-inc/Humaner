'use client';

import * as React from 'react';
import {
  ctaPrimaryClassName,
  ctaPrimaryOnLightClassName
} from '@humaner/shared/cta';

import {
  onboardingGhostButtonClassName,
  onboardingGhostButtonClassNameInverted,
  onboardingOutlineButtonClassName,
  onboardingOutlineButtonClassNameInverted,
  onboardingRadioCardCheckClassName,
  onboardingRadioCardCheckClassNameInverted,
  onboardingRadioCardClassName,
  onboardingRadioCardClassNameInverted
} from '@/components/auth/auth-form-styles';
import { cn } from '@/lib/utils';

export type AuthAppearance = 'dark' | 'light';

/**
 * Dark (default) = dark grainy page + light glass card.
 * Light = light grainy page + dark glass card.
 * Brand chrome is always Humaner (Cloud + Self-Host).
 */
type AuthThemeContextValue = {
  appearance: AuthAppearance;
  setAppearance: (appearance: AuthAppearance) => void;
  toggleAppearance: () => void;
  isInverted: boolean;
};

const AuthThemeContext = React.createContext<AuthThemeContextValue | null>(
  null
);

export function AuthThemeProvider({
  children,
  className
}: React.PropsWithChildren<{ className?: string }>): React.JSX.Element {
  const [appearance, setAppearance] = React.useState<AuthAppearance>('dark');

  const toggleAppearance = React.useCallback(() => {
    setAppearance((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = React.useMemo(
    () => ({
      appearance,
      setAppearance,
      toggleAppearance,
      isInverted: appearance === 'light'
    }),
    [appearance, setAppearance, toggleAppearance]
  );

  return (
    <AuthThemeContext.Provider value={value}>
      <div
        className={cn('auth-root onboarding-root h-full', className)}
        data-auth-appearance={appearance}
        data-onboarding-appearance={appearance}
      >
        {children}
      </div>
    </AuthThemeContext.Provider>
  );
}

export function useAuthTheme(): AuthThemeContextValue {
  const context = React.useContext(AuthThemeContext);
  if (!context) {
    throw new Error('useAuthTheme must be used within AuthThemeProvider');
  }
  return context;
}

/** Returns null outside AuthThemeProvider (dashboard consumers). */
export function useOptionalAuthTheme(): AuthThemeContextValue | null {
  return React.useContext(AuthThemeContext);
}

const glassCardEffects = 'backdrop-blur-3xl backdrop-saturate-150';

/** Dark app theme: dark page + light glass card. */
export const authThemeDark = {
  isInverted: false,
  pageBg: 'bg-[#0A0D0D]',
  pageTitle: 'text-[#fcf4ec]',
  cardBg: cn('bg-[#fcf4ec]/90', glassCardEffects),
  cardText: 'text-[#0A0D0D]',
  cardBorder: 'border-white/50',
  cardRadius: 'rounded-none',
  cardShadow:
    'shadow-[0_32px_80px_-20px_rgb(0_0_0_/_0.55),inset_0_1px_0_rgb(255_255_255_/_0.85)]',
  cardGlow:
    'pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgb(255_255_255_/_0.55),transparent_65%)]',
  fg: 'text-[#0A0D0D]',
  fgMuted: 'text-[#0A0D0D]/50',
  fgSubtle: 'text-[#0A0D0D]/40',
  label:
    'font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#0A0D0D]/65',
  input:
    'h-10 rounded-none border border-[#0A0D0D]/[0.08] bg-[#0A0D0D]/[0.02] text-sm text-[#0A0D0D] shadow-none placeholder:text-[#0A0D0D]/35 selection:bg-[#e0e1df]/12 selection:text-[#0A0D0D] focus-visible:border-[#e0e1df]/50 focus-visible:ring-1 focus-visible:ring-[#e0e1df]/20',
  cardSurface:
    'rounded-none border border-[#0A0D0D]/[0.06] bg-[#0A0D0D]/[0.02]',
  logoText: '[&_span]:text-white',
  progressTrack: 'border-t border-white/25',
  progressDotInactive: 'border-white/25 bg-[#0A0D0D]',
  progressRing: 'ring-offset-[#0A0D0D]',
  cardRingOffset: 'ring-offset-[#fcf4ec]',
  themePicker:
    'rounded-none border-[#0A0D0D]/[0.08] bg-[#0A0D0D]/[0.02] text-[#0A0D0D]/70 hover:text-[#0A0D0D]',
  themePickerActive: 'bg-[#0A0D0D] text-white',
  radioCard: cn(
    onboardingRadioCardClassName,
    'rounded-none py-2 pl-2.5 pr-7',
    'data-[state=checked]:!border-[#e0e1df]/40 data-[state=checked]:!bg-[#e0e1df]/[0.04]'
  ),
  radioCardCheck: onboardingRadioCardCheckClassName,
  outlineButton: cn(
    onboardingOutlineButtonClassName,
    'rounded-none dark:!border-[#0A0D0D]/25 dark:!bg-transparent dark:!text-[#0A0D0D]/80',
    'dark:hover:!border-transparent dark:hover:!bg-[#0A0D0D] dark:hover:!text-[#fcf4ec]'
  ),
  primaryButton: `${ctaPrimaryOnLightClassName} h-10 rounded-none px-4`,
  ghostButton: cn(
    onboardingGhostButtonClassName,
    'rounded-none dark:!text-[#0A0D0D]/60 dark:hover:!bg-[#0A0D0D]/[0.04] dark:hover:!text-[#0A0D0D]'
  ),
  suggestedChip:
    'rounded-none border-dashed border-[#0A0D0D]/10 bg-[#0A0D0D]/[0.02] font-mono text-xs text-[#0A0D0D]/50 transition-colors hover:border-[#e0e1df]/30 hover:text-[#e0e1df]',
  divider: 'border-[#0A0D0D]/[0.06]',
  logoBox: 'rounded-none border-[#0A0D0D]/[0.06] bg-[#0A0D0D]/[0.02]',
  socialLink:
    'rounded-none border-[#0A0D0D]/[0.06] bg-[#0A0D0D]/[0.02] font-mono text-xs font-medium text-[#0A0D0D]/70 transition-colors hover:border-[#0A0D0D]/[0.12] hover:text-[#0A0D0D]',
  radioCardFg: 'text-[#0A0D0D]',
  radioCardFgMuted: 'text-[#0A0D0D]/50',
  radioCardFgSubtle: 'text-[#0A0D0D]/25',
  radioCardIcon: 'text-[#0A0D0D]/70',
  badgeRing: 'border-[#fcf4ec]',
  switchChecked:
    'data-[state=checked]:!bg-[#0A0D0D] data-[state=unchecked]:bg-[#0A0D0D]/15',
  switchThumb: 'data-[state=checked]:!bg-[#fcf4ec]',
  upgradePromptIcon: 'text-[#0A0D0D]/55',
  logOutButton: 'text-white/70 hover:text-white',
  spinner: 'text-[#e0e1df]',
  progressLabel: 'text-[#e0e1df]',
  progressCurrent: 'bg-[#e0e1df]',
  progressPast: 'bg-white/40',
  progressFuture: 'bg-white/25',
  avatarFallback: 'bg-[#e0e1df]/10 text-[#0A0D0D]',
  sizeSelected: 'bg-[#0A0D0D] text-[#fcf4ec]',
  sizeIdle:
    'text-[#0A0D0D]/50 hover:bg-[#0A0D0D]/[0.04] hover:text-[#0A0D0D]/80',
  industrySelected:
    'data-[state=checked]:!border-transparent data-[state=checked]:!bg-[#0A0D0D] data-[state=checked]:!ring-0',
  industrySelectedFg: 'group-data-[state=checked]:text-[#fcf4ec]',
  industrySelectedMuted: 'group-data-[state=checked]:text-[#fcf4ec]/65',
  showGrain: true
} as const;

/** Light app theme: light page + dark glass card. */
export const authThemeLight = {
  isInverted: true,
  pageBg: 'bg-[#fcf4ec]',
  pageTitle: 'text-[#0A0D0D]',
  cardBg: cn('bg-[#0A0D0D]/90', glassCardEffects),
  cardText: 'text-[#fcf4ec]',
  cardBorder: 'border-white/[0.12]',
  cardRadius: 'rounded-none',
  cardShadow:
    'shadow-[0_32px_80px_-20px_rgb(0_0_0_/_0.35),inset_0_1px_0_rgb(255_255_255_/_0.1)]',
  cardGlow:
    'pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgb(255_255_255_/_0.12),transparent_65%)]',
  fg: 'text-[#fcf4ec]',
  fgMuted: 'text-white/50',
  fgSubtle: 'text-white/40',
  label:
    'font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-white/65',
  input:
    'h-10 rounded-none border border-white/[0.08] bg-white/[0.04] text-sm text-[#fcf4ec] shadow-none placeholder:text-white/30 selection:bg-[#e0e1df]/15 selection:text-white focus-visible:border-[#e0e1df]/40 focus-visible:ring-1 focus-visible:ring-[#e0e1df]/20',
  cardSurface: 'rounded-none border border-white/[0.06] bg-white/[0.04]',
  logoText: '[&_span]:text-[#0A0D0D]',
  progressTrack: 'border-t border-[#0A0D0D]/40',
  progressDotInactive: 'border-[#0A0D0D]/40 bg-[#fcf4ec]',
  progressRing: 'ring-offset-[#fcf4ec]',
  cardRingOffset: 'ring-offset-[#0A0D0D]',
  themePicker:
    'rounded-none border-white/[0.08] bg-white/[0.04] text-white/70 hover:text-white',
  themePickerActive: 'bg-[#fcf4ec] text-[#0A0D0D]',
  radioCard: cn(
    onboardingRadioCardClassNameInverted,
    'rounded-none py-2 pl-2.5 pr-7',
    'data-[state=checked]:!border-[#e0e1df]/40 data-[state=checked]:!bg-[#e0e1df]/[0.04]'
  ),
  radioCardCheck: onboardingRadioCardCheckClassNameInverted,
  outlineButton: cn(
    onboardingOutlineButtonClassNameInverted,
    'rounded-none !border-white/20 !bg-transparent !text-white/80',
    'hover:!border-transparent hover:!bg-[#fcf4ec] hover:!text-[#0A0D0D]'
  ),
  primaryButton: `${ctaPrimaryClassName} h-10 rounded-none px-4`,
  ghostButton: cn(
    onboardingGhostButtonClassNameInverted,
    'rounded-none !text-white/60 hover:!bg-white/[0.04] hover:!text-[#fcf4ec]'
  ),
  suggestedChip:
    'rounded-none border-dashed border-white/10 bg-white/[0.04] font-mono text-xs text-white/50 transition-colors hover:border-[#e0e1df]/30 hover:text-[#e0e1df]',
  divider: 'border-white/[0.06]',
  logoBox: 'rounded-none border-white/[0.06] bg-white/[0.04]',
  socialLink:
    'rounded-none border-white/[0.06] bg-white/[0.04] font-mono text-xs font-medium text-white/70 transition-colors hover:border-white/[0.15] hover:text-white',
  radioCardFg: 'text-[#fcf4ec]',
  radioCardFgMuted: 'text-white/50',
  radioCardFgSubtle: 'text-white/25',
  radioCardIcon: 'text-white/70',
  badgeRing: 'border-[#0A0D0D]',
  switchChecked:
    'data-[state=checked]:!bg-[#fcf4ec] data-[state=unchecked]:bg-white/15',
  switchThumb: 'data-[state=checked]:!bg-[#0A0D0D]',
  upgradePromptIcon: 'text-white/55',
  logOutButton: 'text-[#0A0D0D]/70 hover:text-[#0A0D0D]',
  spinner: 'text-[#e0e1df]',
  progressLabel: 'text-[#0A0D0D]/55',
  progressCurrent: 'bg-[#0A0D0D]',
  progressPast: 'bg-[#0A0D0D]/40',
  progressFuture: 'bg-[#0A0D0D]/25',
  avatarFallback: 'bg-[#e0e1df]/15 text-[#fcf4ec]',
  sizeSelected: 'bg-[#fcf4ec] text-[#0A0D0D]',
  sizeIdle: 'text-white/50 hover:bg-white/[0.06] hover:text-white/85',
  industrySelected:
    'data-[state=checked]:!border-transparent data-[state=checked]:!bg-[#fcf4ec] data-[state=checked]:!ring-0',
  industrySelectedFg: 'group-data-[state=checked]:text-[#0A0D0D]',
  industrySelectedMuted: 'group-data-[state=checked]:text-[#0A0D0D]/60',
  showGrain: true
} as const;

export function useAuthThemeClasses() {
  const { isInverted } = useAuthTheme();
  return isInverted ? authThemeLight : authThemeDark;
}

export type AuthThemeClasses = typeof authThemeDark | typeof authThemeLight;

/** Theme classes when inside provider; null on dashboard pages. */
export function useOptionalAuthThemeClasses(): AuthThemeClasses | null {
  const context = useOptionalAuthTheme();
  if (!context) {
    return null;
  }
  return context.isInverted ? authThemeLight : authThemeDark;
}

/** @deprecated Use Auth* names. Kept so Cloud onboarding can import from auth. */
export type OnboardingAppearance = AuthAppearance;
export type OnboardingThemeClasses = AuthThemeClasses;
export const OnboardingThemeProvider = AuthThemeProvider;
export const useOnboardingTheme = useAuthTheme;
export const useOptionalOnboardingTheme = useOptionalAuthTheme;
export const useOnboardingThemeClasses = useAuthThemeClasses;
export const useOptionalOnboardingThemeClasses = useOptionalAuthThemeClasses;
export const onboardingThemeDark = authThemeDark;
export const onboardingThemeLight = authThemeLight;
