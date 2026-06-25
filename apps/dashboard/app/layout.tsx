import './globals.css';

import * as React from 'react';
import type { Metadata, Viewport } from 'next';

import { Providers } from '@/app/providers';
import { Toaster } from '@/components/ui/sonner';
import { AppInfo } from '@/constants/app-info';
import { fellix, theSeasons } from '@/lib/fonts';
import { getBaseUrl } from '@/lib/urls/get-base-url';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  themeColor: [{ media: '(prefers-color-scheme: light)', color: 'white' }]
};

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: AppInfo.APP_NAME,
  description: AppInfo.APP_DESCRIPTION,
  icons: {
    icon: '/humaner.svg',
    shortcut: '/humaner.svg',
    apple: '/humaner.svg'
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
  return (
    <html
      lang="en"
      className={`size-full min-h-screen ${fellix.variable} ${theSeasons.variable}`}
      suppressHydrationWarning
    >
      <body className="size-full font-sans">
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
