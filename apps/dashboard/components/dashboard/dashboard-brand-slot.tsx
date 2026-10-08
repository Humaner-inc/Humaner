'use client';

import * as React from 'react';
import Link from 'next/link';

import { HumanerBrandTitle } from '@/components/brand/humaner-brand-title';
import { useSidebar } from '@/components/ui/sidebar';
import { AppInfo } from '@/constants/app-info';
import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';

const brandmarkMaskStyle: React.CSSProperties = {
  WebkitMaskImage: 'url(/brandmark_blue.svg)',
  maskImage: 'url(/brandmark_blue.svg)',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
  WebkitMaskSize: 'contain',
  maskSize: 'contain'
};

/** Top-left brand, sized to the sidebar column so it sits above the panel. */
export function DashboardBrandSlot({
  homeHref = Routes.Overview
}: {
  homeHref?: string;
}): React.JSX.Element | null {
  const sidebar = useSidebar();
  const collapsed = !sidebar.open;

  if (sidebar.isMobileFullPage) {
    return null;
  }

  return (
    <div
      className="flex h-8 shrink-0 items-center transition-[width] duration-200 ease-linear"
      style={{
        width: collapsed ? 'var(--sidebar-width-icon)' : 'var(--sidebar-width)'
      }}
    >
      <Link
        href={homeHref}
        aria-label={`${AppInfo.APP_NAME} home`}
        className={cn(
          'flex min-w-0 flex-1 items-center',
          collapsed ? 'justify-center' : 'px-2.5'
        )}
      >
        {collapsed ? (
          <span
            aria-hidden
            className="inline-block size-6 shrink-0 bg-[linear-gradient(180deg,#0A0D0D_0%,#6d7272_100%)] dark:bg-[linear-gradient(180deg,#F2F2F2_0%,#8d9191_100%)]"
            style={brandmarkMaskStyle}
          />
        ) : (
          <HumanerBrandTitle
            name={AppInfo.APP_NAME}
            className="min-w-0"
            wordmarkClassName="inline-block truncate bg-[linear-gradient(180deg,#0A0D0D_0%,#6d7272_100%)] bg-clip-text font-display text-lg font-normal tracking-tight text-transparent dark:bg-[linear-gradient(180deg,#F2F2F2_0%,#8d9191_100%)]"
          />
        )}
      </Link>
    </div>
  );
}
