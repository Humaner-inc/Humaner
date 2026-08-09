import type { BrandConfig } from '@/lib/theme/types';

/**
 * Deploy-time brand config — always Humaner (Cloud + Self-Host).
 * Feature/content splits stay on `NEXT_PUBLIC_DEPLOYMENT_MODE=oss`.
 *
 * Neutrals only:
 *   Light: #fff8f2 · #f2f2f2 · #eaeaea
 *   Dark:  #0A0D0D · #18181b · #1c1c1e
 * Accents (cream / charts / destructive) are not neutrals.
 */

const humanerBrand: BrandConfig = {
  name: 'Humaner',
  shortName: 'Humaner',
  logo: '/humaner.svg',
  logoDark: '/humaner.svg',
  favicon: '/favicon.svg',
  labels: {
    helpdesk: 'Helpdesk',
    agent: 'Agent'
  },
  light: {
    /* #fff8f2 */
    background: '28 100% 97.5%',
    /* #0A0D0D */
    foreground: '180 13% 4.5%',
    card: '28 100% 97.5%',
    primary: '35 45% 78%',
    primaryForeground: '180 13% 4.5%',
    /* #f2f2f2 */
    secondary: '0 0% 95%',
    secondaryForeground: '180 13% 4.5%',
    muted: '0 0% 95%',
    /* #18181b */
    mutedForeground: '240 6% 10%',
    accent: '0 0% 95%',
    accentForeground: '180 13% 4.5%',
    brand: '35 45% 78%',
    brandForeground: '180 13% 4.5%',
    destructive: '0 72% 45%',
    destructiveForeground: '0 0% 100%',
    /* #eaeaea */
    border: '0 0% 92%',
    input: '0 0% 92%',
    ring: '240 6% 10%',
    sidebarBackground: '28 100% 97.5%',
    sidebarForeground: '180 13% 4.5%',
    sidebarPrimary: '35 45% 78%',
    sidebarActive: '180 13% 4.5%',
    sidebarActiveForeground: '28 100% 97.5%',
    sidebarBorder: '0 0% 92%',
    chart1: '180 13% 4.5%',
    chart2: '35 45% 78%',
    chart3: '24 60% 55%',
    chart4: '43 74% 60%',
    chart5: '240 6% 10%'
  },
  dark: {
    /* #0A0D0D */
    background: '180 13% 4.5%',
    /* #fff8f2 */
    foreground: '28 100% 97.5%',
    /* #18181b */
    card: '240 6% 10%',
    primary: '35 45% 82%',
    primaryForeground: '180 13% 4.5%',
    /* #1c1c1e */
    secondary: '240 4% 11%',
    secondaryForeground: '28 100% 97.5%',
    muted: '240 4% 11%',
    /* #eaeaea */
    mutedForeground: '0 0% 92%',
    accent: '240 4% 11%',
    accentForeground: '28 100% 97.5%',
    brand: '35 45% 82%',
    brandForeground: '180 13% 4.5%',
    destructive: '0 62% 42%',
    destructiveForeground: '0 0% 100%',
    border: '240 4% 11%',
    input: '240 4% 11%',
    ring: '0 0% 92%',
    sidebarBackground: '180 13% 4.5%',
    sidebarForeground: '28 100% 97.5%',
    sidebarPrimary: '35 45% 82%',
    sidebarActive: '28 100% 97.5%',
    sidebarActiveForeground: '180 13% 4.5%',
    sidebarBorder: '240 4% 11%',
    chart1: '0 0% 95%',
    chart2: '35 45% 82%',
    chart3: '24 55% 58%',
    chart4: '43 65% 62%',
    chart5: '0 0% 92%'
  },
  radius: '0px'
};

export const brand: BrandConfig = humanerBrand;

export { humanerBrand };
