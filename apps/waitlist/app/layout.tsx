import type { Metadata } from 'next';

import { fellix, theSeasons } from '@/lib/fonts';
import { createTitle } from '@/lib/utils';

import './globals.css';

export const metadata: Metadata = {
  title: createTitle('Customer support that feels human.'),
  description:
    'Join the Humaner waitlist. Be first to cast customer agents that sound like your brand — not generic bots.',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en">
      <body
        className={`${fellix.variable} ${theSeasons.variable} min-h-screen bg-foreground font-sans text-background antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
