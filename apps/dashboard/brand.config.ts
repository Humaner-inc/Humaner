import type { BrandConfig } from '@/lib/theme/types';

/**
 * Deploy-time brand config — always Humaner (Cloud + Self-Host).
 * Feature/content splits stay on `NEXT_PUBLIC_DEPLOYMENT_MODE=oss`.
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
    background: '40 20% 97%',
    foreground: '300 8% 2.5%',
    card: '38 24% 95%',
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
    card: '300 6% 5.5%',
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

export const brand: BrandConfig = humanerBrand;

export { humanerBrand };
