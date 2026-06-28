import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Velvet & Vine — Humaner integration demo',
  description:
    'Demo landing page for testing Humaner widget embeds and custom REST API chat locally.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
