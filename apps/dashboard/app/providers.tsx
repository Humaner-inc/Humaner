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
  const isWidget = pathname?.startsWith('/widget') ?? false;

  return (
    <NuqsAdapter>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        enableColorScheme={!isWidget}
        disableTransitionOnChange
      >
        <TooltipProvider>
          <NiceModal.Provider>{children}</NiceModal.Provider>
        </TooltipProvider>
      </ThemeProvider>
    </NuqsAdapter>
  );
}
