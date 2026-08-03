/**
 * Sample Self-Host white-label override.
 * Copy over brand.config.ts and replace logos under public/brand/.
 */
import type { BrandConfig } from '@/lib/theme/types';

export const brand: BrandConfig = {
  name: 'Acme Support',
  shortName: 'Acme',
  logo: '/brand/logo.svg',
  logoDark: '/brand/logo-dark.svg',
  favicon: '/brand/favicon.svg',
  labels: {
    helpdesk: 'Helpdesk',
    agent: 'Agent'
  },
  // Reuse Humaner HSL tokens until you customize — edit light/dark as needed.
  light: {
    background: '40 20% 97%',
    foreground: '300 8% 2.5%',
    primary: '221 83% 53%',
    primaryForeground: '0 0% 100%',
    secondary: '36 22% 93%',
    secondaryForeground: '300 8% 2.5%',
    muted: '36 18% 93%',
    mutedForeground: '330 5% 40%',
    accent: '36 18% 93%',
    accentForeground: '300 8% 2.5%',
    brand: '221 83% 53%',
    brandForeground: '0 0% 100%',
    destructive: '0 72% 45%',
    destructiveForeground: '0 0% 100%',
    border: '340 12% 88%',
    input: '340 12% 88%',
    ring: '221 83% 53%',
    sidebarBackground: '38 24% 95%',
    sidebarForeground: '300 8% 2.5%',
    sidebarPrimary: '221 83% 53%',
    sidebarActive: '300 8% 2.5%',
    sidebarActiveForeground: '0 0% 96%',
    sidebarBorder: '340 12% 88%',
    chart1: '221 83% 53%',
    chart2: '35 45% 78%',
    chart3: '24 60% 55%',
    chart4: '43 74% 60%',
    chart5: '300 8% 25%'
  },
  dark: {
    background: '300 8% 2.55%',
    foreground: '0 0% 96%',
    primary: '217 91% 60%',
    primaryForeground: '300 8% 2.5%',
    secondary: '300 5% 11%',
    secondaryForeground: '0 0% 96%',
    muted: '300 5% 11%',
    mutedForeground: '330 6% 58%',
    accent: '300 5% 11%',
    accentForeground: '0 0% 96%',
    brand: '217 91% 60%',
    brandForeground: '300 8% 2.5%',
    destructive: '0 62% 42%',
    destructiveForeground: '0 0% 100%',
    border: '300 5% 14%',
    input: '300 5% 14%',
    ring: '217 91% 60%',
    sidebarBackground: '300 8% 2.55%',
    sidebarForeground: '0 0% 96%',
    sidebarPrimary: '217 91% 60%',
    sidebarActive: '0 0% 96%',
    sidebarActiveForeground: '300 8% 2.5%',
    sidebarBorder: '300 5% 14%',
    chart1: '217 91% 60%',
    chart2: '35 45% 82%',
    chart3: '24 55% 58%',
    chart4: '43 65% 62%',
    chart5: '300 8% 72%'
  },
  radius: '0px'
};
