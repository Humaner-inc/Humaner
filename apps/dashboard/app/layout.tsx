import './globals.css';

import * as React from 'react';
import type { Metadata, Viewport } from 'next';
import { HUMANER_TITLE } from '@humaner/shared/product-positioning';

import { Providers } from '@/app/providers';
import { Toaster } from '@/components/ui/sonner';
import { AppInfo } from '@/constants/app-info';
import { isOssDeployment } from '@/lib/deployment-mode';
import { comfortaaBold, fellix, humanerMono } from '@/lib/fonts';
import { getBaseUrl } from '@/lib/urls/get-base-url';

const oss = isOssDeployment();
const description = oss
  ? `${AppInfo.APP_NAME} — customer support kit (Helpdesk, BYO agent, team & org).`
  : AppInfo.APP_DESCRIPTION;

function metadataBaseUrl(clientBaseUrl: string): URL {
  try {
    const u = new URL(clientBaseUrl);
    if (
      u.protocol === 'http:' &&
      u.hostname !== 'localhost' &&
      u.hostname !== '127.0.0.1'
    ) {
      u.protocol = 'https:';
    }
    return u;
  } catch {
    return new URL('https://app.humaner.io');
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fcf4ec' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0D0D' }
  ]
};

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl(getBaseUrl()),
  title: {
    default: `${AppInfo.APP_NAME} | ${HUMANER_TITLE}`,
    template: '%s'
  },
  description,
  icons: {
    icon: [{ url: '/favicon.svg?v=20260921', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg?v=20260921',
    apple: [{ url: '/favicon.svg?v=20260921', type: 'image/svg+xml' }]
  },
  manifest: `${getBaseUrl()}/manifest`,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: AppInfo.APP_NAME,
    title: `${AppInfo.APP_NAME} — ${HUMANER_TITLE}`,
    description,
    url: getBaseUrl()
  },
  robots: {
    index: false,
    follow: true
  }
};

export default function RootLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <html
      lang="en"
      className={`size-full min-h-screen ${fellix.variable} ${comfortaaBold.variable} ${humanerMono.variable}`}
      suppressHydrationWarning
    >
      <body className="size-full font-sans">
        <React.Suspense>
          <Providers>
            {children}
            <React.Suspense>
              <Toaster />
            </React.Suspense>
          </Providers>
        </React.Suspense>
      </body>
    </html>
  );
}
