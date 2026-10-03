import type { BrandConfig } from '@/lib/theme/types';

/**
 * Deploy-time brand config — always Humaner (Cloud + Self-Host).
 * Feature/content splits stay on `NEXT_PUBLIC_DEPLOYMENT_MODE=oss`.
 *
 * Neutrals only:
 *   Light: #f2f2f2 · #e0e1df · #eaeaea
 *   Dark:  #0A0D0D · #18181b · #1c1c1e
 * Accents (charts / status) are not neutrals.
 */

const humanerBrand: BrandConfig = {
  name: 'Humaner',
  shortName: 'Humaner',
  logo: '/brandmark_blue.svg',
  logoDark: '/favicon.svg',
  favicon: '/favicon.svg',
  labels: {
    helpdesk: 'Helpdesk',
    agent: 'Agent'
  },
  light: {
    /* #f2f2f2 */
    background: '0 0% 95%',
    /* #0A0D0D */
    foreground: '180 13% 4.5%',
    card: '0 0% 95%',
    /* #e0e1df */
    primary: '90 3% 88%',
    /* #0A0D0D */
    primaryForeground: '180 13% 4.5%',
    /* #e0e1df */
    secondary: '90 3% 88%',
    secondaryForeground: '180 13% 4.5%',
    muted: '90 3% 88%',
    /* #18181b */
    mutedForeground: '240 6% 10%',
    accent: '90 3% 88%',
    accentForeground: '180 13% 4.5%',
    brand: '90 3% 88%',
    brandForeground: '180 13% 4.5%',
    destructive: '3 75% 38%',
    destructiveForeground: '0 0% 100%',
    /* #eaeaea */
    border: '0 0% 92%',
    input: '0 0% 92%',
    ring: '240 6% 10%',
    sidebarBackground: '0 0% 95%',
    sidebarForeground: '180 13% 4.5%',
    sidebarPrimary: '90 3% 88%',
    sidebarActive: '180 13% 4.5%',
    sidebarActiveForeground: '0 0% 95%',
    sidebarBorder: '0 0% 92%',
    chart1: '180 13% 4.5%',
    chart2: '90 3% 88%',
    chart3: '24 60% 55%',
    chart4: '43 74% 60%',
    chart5: '240 6% 10%'
  },
  dark: {
    /* #0A0D0D */
    background: '180 13% 4.5%',
    /* #f2f2f2 */
    foreground: '0 0% 95%',
    /* #18181b */
    card: '240 6% 10%',
    /* #e0e1df */
    primary: '90 3% 88%',
    /* #f2f2f2 */
    primaryForeground: '0 0% 95%',
    /* #1c1c1e */
    secondary: '240 4% 11%',
    secondaryForeground: '0 0% 95%',
    muted: '240 4% 11%',
    /* #eaeaea */
    mutedForeground: '0 0% 92%',
    accent: '240 4% 11%',
    accentForeground: '0 0% 95%',
    brand: '90 3% 88%',
    brandForeground: '0 0% 95%',
    destructive: '3 75% 38%',
    destructiveForeground: '0 0% 100%',
    border: '240 4% 11%',
    input: '240 4% 11%',
    ring: '0 0% 92%',
    sidebarBackground: '180 13% 4.5%',
    sidebarForeground: '0 0% 95%',
    sidebarPrimary: '90 3% 88%',
    sidebarActive: '0 0% 95%',
    sidebarActiveForeground: '180 13% 4.5%',
    sidebarBorder: '240 4% 11%',
    chart1: '0 0% 95%',
    chart2: '90 3% 88%',
    chart3: '24 55% 58%',
    chart4: '43 65% 62%',
    chart5: '0 0% 92%'
  },
  radius: '12px'
};

export const brand: BrandConfig = humanerBrand;

export { humanerBrand };
