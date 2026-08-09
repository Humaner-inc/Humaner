'use client';

import * as React from 'react';

import { useSidebar } from '@/components/ui/sidebar';

/** Dims main content when the sidebar is manually expanded below the auto-collapse breakpoint. */
export function SidebarOverlayBackdrop(): React.JSX.Element | null {
  const { isOverlayExpanded, setOpen } = useSidebar();

  if (!isOverlayExpanded) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="Close sidebar"
      className="fixed inset-0 z-30 bg-[#0A0D0D]/45"
      onClick={() => setOpen(false)}
    />
  );
}
