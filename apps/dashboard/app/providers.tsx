'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { ThemeProvider } from 'next-themes';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { TooltipProvider } from '@/components/ui/tooltip';

export function Providers({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <NuqsAdapter>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        forcedTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <TooltipProvider>
          <NiceModal.Provider>{children}</NiceModal.Provider>
        </TooltipProvider>
      </ThemeProvider>
    </NuqsAdapter>
  );
}
