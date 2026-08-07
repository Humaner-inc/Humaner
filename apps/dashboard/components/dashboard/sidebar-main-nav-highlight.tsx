'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { useSidebar } from '@/components/ui/sidebar';
import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

export const SIDEBAR_MAIN_NAV_ATTR = 'data-sidebar-main-nav';

type HighlightStyle = {
  top: number;
  height: number;
  opacity: number;
};

const HIDDEN_HIGHLIGHT: HighlightStyle = {
  top: 0,
  height: 0,
  opacity: 0
};

function measureMainNavHighlight(
  container: HTMLElement | null
): HighlightStyle {
  if (!container) {
    return HIDDEN_HIGHLIGHT;
  }

  const active = container.querySelector<HTMLElement>(
    `[${SIDEBAR_MAIN_NAV_ATTR}][data-active="true"]`
  );

  if (!active) {
    return HIDDEN_HIGHLIGHT;
  }

  const containerRect = container.getBoundingClientRect();
  const activeRect = active.getBoundingClientRect();

  return {
    top: activeRect.top - containerRect.top + container.scrollTop,
    height: activeRect.height,
    opacity: 1
  };
}

function highlightEqual(a: HighlightStyle, b: HighlightStyle): boolean {
  return a.top === b.top && a.height === b.height && a.opacity === b.opacity;
}

export type SidebarMainNavHighlightProps = {
  children: React.ReactNode;
  className?: string;
};

export function SidebarMainNavHighlight({
  children,
  className
}: SidebarMainNavHighlightProps): React.JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rafRef = React.useRef<number | null>(null);
  const [highlight, setHighlight] =
    React.useState<HighlightStyle>(HIDDEN_HIGHLIGHT);
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();
  const isIconRail = state === 'collapsed' && !isMobile;

  const syncHighlight = React.useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const next = measureMainNavHighlight(containerRef.current);
      setHighlight((prev) => (highlightEqual(prev, next) ? prev : next));
    });
  }, []);

  React.useLayoutEffect(() => {
    syncHighlight();

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      syncHighlight();
    });

    resizeObserver.observe(container);
    for (const item of container.querySelectorAll(
      `[${SIDEBAR_MAIN_NAV_ATTR}]`
    )) {
      resizeObserver.observe(item);
    }

    const mutationObserver = new MutationObserver(() => {
      syncHighlight();
    });

    mutationObserver.observe(container, {
      attributes: true,
      attributeFilter: ['data-active'],
      subtree: true
    });

    window.addEventListener('resize', syncHighlight);
    container.addEventListener('scroll', syncHighlight, { passive: true });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', syncHighlight);
      container.removeEventListener('scroll', syncHighlight);
    };
  }, [syncHighlight, pathname, isIconRail]);

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bg-muted/40 sidebar-nav-highlight-pill',
          dashboardRadiusClassName,
          isIconRail && 'bg-muted/50'
        )}
        style={{
          top: highlight.top,
          height: highlight.height,
          opacity: highlight.opacity
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
