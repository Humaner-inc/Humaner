'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import NiceModal from '@ebay/nice-modal-react';
import { ThemeProvider } from 'next-themes';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { TooltipProvider } from '@/components/ui/tooltip';

export function Providers({
  children
}: React.PropsWithChildren): React.JSX.Element {
  const pathname = usePathname();
  const forceInk =
    pathname === '/onboarding' ||
    pathname?.startsWith('/onboarding/') ||
    pathname === '/auth' ||
    pathname?.startsWith('/auth/') ||
    false;

  return (
    <NuqsAdapter>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        forcedTheme={forceInk ? 'dark' : undefined}
        enableSystem={false}
        enableColorScheme
        disableTransitionOnChange
      >
        <TooltipProvider>
          <NiceModal.Provider>{children}</NiceModal.Provider>
        </TooltipProvider>
      </ThemeProvider>
    </NuqsAdapter>
  );
}
