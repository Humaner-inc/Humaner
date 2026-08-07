import type { BrandConfig } from '@/lib/theme/types';

/**
 * Deploy-time brand config.
 * - Cloud (default): Humaner tokens
 * - Self-Host (`NEXT_PUBLIC_DEPLOYMENT_MODE=oss`): Acme + Achromatic colors
 */

const humanerBrand: BrandConfig = {
  name: 'Humaner',
  shortName: 'Humaner',
  logo: '/humaner.svg',
  logoDark: '/humaner.svg',
  favicon: '/favicon.ico',
  labels: {
    helpdesk: 'Helpdesk',
    agent: 'Agent'
  },
  light: {
    background: '40 20% 97%',
    foreground: '300 8% 2.5%',
    primary: '35 45% 78%',
    primaryForeground: '300 8% 2.5%',
    secondary: '36 22% 93%',
    secondaryForeground: '300 8% 2.5%',
    muted: '36 18% 93%',
    mutedForeground: '330 5% 40%',
    accent: '36 18% 93%',
    accentForeground: '300 8% 2.5%',
    brand: '35 45% 78%',
    brandForeground: '300 8% 2.5%',
    destructive: '0 72% 45%',
    destructiveForeground: '0 0% 100%',
    border: '340 12% 88%',
    input: '340 12% 88%',
    ring: '300 8% 72%',
    sidebarBackground: '38 24% 95%',
    sidebarForeground: '300 8% 2.5%',
    sidebarPrimary: '35 45% 78%',
    sidebarActive: '300 8% 2.5%',
    sidebarActiveForeground: '0 0% 96%',
    sidebarBorder: '340 12% 88%',
    chart1: '300 8% 28%',
    chart2: '35 45% 78%',
    chart3: '24 60% 55%',
    chart4: '43 74% 60%',
    chart5: '300 8% 25%'
  },
  dark: {
    background: '300 8% 2.55%',
    foreground: '0 0% 96%',
    primary: '35 45% 82%',
    primaryForeground: '300 8% 2.5%',
    secondary: '300 5% 11%',
    secondaryForeground: '0 0% 96%',
    muted: '300 5% 11%',
    mutedForeground: '330 6% 58%',
    accent: '300 5% 11%',
    accentForeground: '0 0% 96%',
    brand: '35 45% 82%',
    brandForeground: '300 8% 2.5%',
    destructive: '0 62% 42%',
    destructiveForeground: '0 0% 100%',
    border: '300 5% 14%',
    input: '300 5% 14%',
    ring: '300 5% 38%',
    sidebarBackground: '300 8% 2.55%',
    sidebarForeground: '0 0% 96%',
    sidebarPrimary: '35 45% 82%',
    sidebarActive: '0 0% 96%',
    sidebarActiveForeground: '300 8% 2.5%',
    sidebarBorder: '300 5% 14%',
    chart1: '0 0% 72%',
    chart2: '35 45% 82%',
    chart3: '24 55% 58%',
    chart4: '43 65% 62%',
    chart5: '300 8% 72%'
  },
  radius: '0px'
};

/** Acme kit — Achromatic Pro palette (zinc / neutral). */
const acmeBrand: BrandConfig = {
  name: 'Acme',
  shortName: 'Acme',
  logo: '/brand/acme.svg',
  logoDark: '/brand/acme.svg',
  favicon: '/brand/acme.svg',
  labels: {
    helpdesk: 'Helpdesk',
    agent: 'Agent'
  },
  light: {
    background: '0 0% 100%',
    foreground: '240 10% 3.9%',
    primary: '240 5.9% 10%',
    primaryForeground: '0 0% 98%',
    secondary: '240 4.8% 95.9%',
    secondaryForeground: '240 5.9% 10%',
    muted: '240 4.8% 95.9%',
    mutedForeground: '240 3.8% 46.1%',
    accent: '240 4.8% 95.9%',
    accentForeground: '240 5.9% 10%',
    brand: '240 5.9% 10%',
    brandForeground: '0 0% 98%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '0 0% 98%',
    border: '240 5.9% 90%',
    input: '240 5.9% 90%',
    ring: '240 10% 3.9%',
    sidebarBackground: '0 0% 100%',
    sidebarForeground: '240 10% 3.9%',
    sidebarPrimary: '240 5.9% 10%',
    sidebarActive: '240 5.9% 10%',
    sidebarActiveForeground: '0 0% 98%',
    sidebarBorder: '240 5.9% 90%',
    chart1: '12 76% 61%',
    chart2: '173 58% 39%',
    chart3: '197 37% 24%',
    chart4: '43 74% 66%',
    chart5: '27 87% 67%'
  },
  dark: {
    background: '240 10% 3.9%',
    foreground: '0 0% 98%',
    primary: '0 0% 98%',
    primaryForeground: '240 5.9% 10%',
    secondary: '240 3.7% 15.9%',
    secondaryForeground: '0 0% 98%',
    muted: '240 3.7% 15.9%',
    mutedForeground: '240 5% 64.9%',
    accent: '240 3.7% 15.9%',
    accentForeground: '0 0% 98%',
    brand: '0 0% 98%',
    brandForeground: '240 5.9% 10%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '0 0% 98%',
    border: '240 3.7% 15.9%',
    input: '240 3.7% 15.9%',
    ring: '240 4.9% 83.9%',
    sidebarBackground: '240 10% 3.9%',
    sidebarForeground: '0 0% 98%',
    sidebarPrimary: '0 0% 98%',
    sidebarActive: '0 0% 98%',
    sidebarActiveForeground: '240 5.9% 10%',
    sidebarBorder: '240 3.7% 15.9%',
    chart1: '220 70% 50%',
    chart2: '160 60% 45%',
    chart3: '30 80% 55%',
    chart4: '280 65% 60%',
    chart5: '340 75% 55%'
  },
  radius: '0.5rem'
};

const isOss =
  process.env.NEXT_PUBLIC_DEPLOYMENT_MODE?.trim().toLowerCase() === 'oss';

export const brand: BrandConfig = isOss ? acmeBrand : humanerBrand;

/** Explicit exports for docs / sync overlays. */
export { humanerBrand, acmeBrand };
