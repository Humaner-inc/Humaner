/** White-label brand config for Self-Host (and default Humaner Cloud branding). */

export type BrandColorTokens = {
  background: string;
  foreground: string;
  /** Panel / Card surfaces — solid match for bg-muted/20 (embed terminal). */
  card: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  brand: string;
  brandForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarActive: string;
  sidebarActiveForeground: string;
  sidebarBorder: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
};

export type BrandConfig = {
  name: string;
  shortName: string;
  logo: string;
  logoDark?: string;
  favicon: string;
  labels: {
    helpdesk: string;
    agent: string;
  };
  light: BrandColorTokens;
  dark: BrandColorTokens;
  radius: string;
};
