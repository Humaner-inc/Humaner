import './globals.css';

import * as React from 'react';
import type { Metadata, Viewport } from 'next';
import { brand } from '@/brand.config';

import { Providers } from '@/app/providers';
import { Toaster } from '@/components/ui/sonner';
import { AppInfo } from '@/constants/app-info';
import { isOssDeployment } from '@/lib/deployment-mode';
import { fellix, humanerMono, theSeasons } from '@/lib/fonts';
import { brandThemeStyleTag, getBrandFavicon } from '@/lib/theme/brand';
import { getBaseUrl } from '@/lib/urls/get-base-url';

const oss = isOssDeployment();

/** Self-Host: Fellix + mono only — remap display to Fellix (no The Seasons). */
const ossFontOverride = `
  :root {
    --font-the-seasons: var(--font-fellix), system-ui, sans-serif;
  }
  .font-display {
    font-family: var(--font-fellix), system-ui, sans-serif;
    font-feature-settings: normal;
    letter-spacing: -0.01em;
  }
  /* Zinc selection — override Humaner cream ::selection from globals.css */
  ::selection {
    background-color: rgb(24 24 27 / 0.18);
    color: #09090b;
  }
  ::-moz-selection {
    background-color: rgb(24 24 27 / 0.18);
    color: #09090b;
  }
  .dark ::selection {
    background-color: rgb(250 250 250 / 0.22);
    color: #fafafa;
  }
  .dark ::-moz-selection {
    background-color: rgb(250 250 250 / 0.22);
    color: #fafafa;
  }
`;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  themeColor: oss
    ? [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#09090b' }
      ]
    : [
        { media: '(prefers-color-scheme: light)', color: '#070607' },
        { media: '(prefers-color-scheme: dark)', color: '#070607' }
      ]
};

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: AppInfo.APP_NAME,
  description: oss
    ? `${brand.name} — customer support kit (Helpdesk, BYO agent, team & org).`
    : AppInfo.APP_DESCRIPTION,
  icons: {
    icon: oss ? getBrandFavicon() : '/favicon.svg',
    shortcut: oss ? getBrandFavicon() : '/favicon.svg',
    apple: oss ? getBrandFavicon() : '/favicon.svg'
  },
  manifest: `${getBaseUrl()}/manifest`,
  robots: {
    index: true,
    follow: true
  }
};

export default async function RootLayout({
  children
}: React.PropsWithChildren): Promise<React.JSX.Element> {
  const fontClass = oss
    ? `size-full min-h-screen ${fellix.variable} ${humanerMono.variable}`
    : `size-full min-h-screen ${fellix.variable} ${theSeasons.variable} ${humanerMono.variable}`;

  return (
    <html
      lang="en"
      className={fontClass}
      suppressHydrationWarning
    >
      <body className="size-full font-sans">
        {oss ? (
          <style
            dangerouslySetInnerHTML={{
              __html: `${brandThemeStyleTag()}${ossFontOverride}`
            }}
          />
        ) : null}
        <Providers>
          {children}
          <React.Suspense>
            <Toaster />
          </React.Suspense>
        </Providers>
      </body>
    </html>
  );
}
