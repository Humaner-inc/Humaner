'use client';

import { useEffect, useState, type RefObject } from 'react';

import { cn } from '@/lib/utils';

export const TRUNK_X = 12;
export const PILL_X = 52;
export const NODE_Y = 11;
export const TRUNK_START_Y = 28;
export const SCROLL_ANCHOR_RATIO = 0.38;

export function branchToPillPath(endX: number = PILL_X): string {
  return `M ${TRUNK_X} ${NODE_Y} L ${endX} ${NODE_Y}`;
}

export type BranchTimelineState = {
  trunkFillPx: number;
  trunkExtentPx: number;
  trunkTrackPx: number;
  ctaTailProgress: number;
  activeIndex: number;
  branchProgress: number[];
  nodeFillProgress: number[];
};

type UseBranchScrollTimelineOptions = {
  nodeCount: number;
  stepCount: number;
  stepRefs: RefObject<(HTMLElement | null)[]>;
  timelineRef: RefObject<HTMLDivElement | null>;
  ctaRef?: RefObject<HTMLElement | null>;
};

export function useBranchScrollTimeline({
  nodeCount,
  stepCount,
  stepRefs,
  timelineRef,
  ctaRef
}: UseBranchScrollTimelineOptions): BranchTimelineState {
  const [timeline, setTimeline] = useState<BranchTimelineState>({
    trunkFillPx: 0,
    trunkExtentPx: 0,
    trunkTrackPx: 0,
    ctaTailProgress: 0,
    activeIndex: 0,
    branchProgress: Array.from({ length: nodeCount }, () => 0),
    nodeFillProgress: Array.from({ length: nodeCount }, () => 0)
  });

  useEffect(() => {
    let raf = 0;

    const getNode = (index: number): HTMLElement | null => {
      if (index < stepCount) {
        return stepRefs.current?.[index] ?? null;
      }
      return ctaRef?.current ?? null;
    };

    const getCtaNodeOffsetPx = (containerRect: DOMRect): number | null => {
      const cta = ctaRef?.current;
      if (!cta) return null;

      const ctaNodeTop =
        cta.getBoundingClientRect().top - containerRect.top + NODE_Y;

      return Math.max(0, ctaNodeTop - TRUNK_START_Y);
    };

    const getTrunkExtentPx = (
      container: HTMLDivElement,
      containerRect: DOMRect
    ): number => {
      const ctaOffset = getCtaNodeOffsetPx(containerRect);
      if (ctaOffset !== null) return ctaOffset;

      const cta = ctaRef?.current;
      if (cta) {
        const ctaRect = cta.getBoundingClientRect();
        return Math.max(0, ctaRect.top - containerRect.top + NODE_Y - TRUNK_START_Y);
      }

      return Math.max(0, container.offsetHeight - TRUNK_START_Y);
    };

    const computeProgress = (
      containerRect: DOMRect,
      trunkFillPx: number,
      anchorY: number
    ): {
      activeIndex: number;
      branchProgress: number[];
      nodeFillProgress: number[];
    } => {
      let activeIndex = 0;
      const nodeFillProgress: number[] = [];

      const branchProgress = Array.from({ length: nodeCount }, (_, index) => {
        const element = getNode(index);
        if (!element) {
          nodeFillProgress.push(0);
          return 0;
        }

        const stepRect = element.getBoundingClientRect();
        const nodeViewportY = stepRect.top + NODE_Y;
        const stepTop = stepRect.top - containerRect.top + NODE_Y;
        const fillEnd = trunkFillPx + TRUNK_START_Y;
        const distPastNode = fillEnd - stepTop;

        if (nodeViewportY <= anchorY) activeIndex = index;

        nodeFillProgress.push(
          distPastNode > 0 ? Math.min(1, distPastNode / 10) : 0
        );

        return distPastNode > 0 ? Math.min(1, distPastNode / 24) : 0;
      });

      return { activeIndex, branchProgress, nodeFillProgress };
    };

    const updateTimeline = (): void => {
      const container = timelineRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const anchorY = window.innerHeight * SCROLL_ANCHOR_RATIO;
      const trunkExtentPx = getTrunkExtentPx(container, containerRect);
      const ctaNodeOffsetPx = getCtaNodeOffsetPx(containerRect);

      let trunkFillPx = Math.max(
        0,
        Math.min(trunkExtentPx, anchorY - containerRect.top - TRUNK_START_Y)
      );

      const trunkTrackPx = trunkExtentPx;
      const ctaTailProgress = 0;

      const cta = ctaRef?.current;
      if (cta && ctaNodeOffsetPx !== null) {
        const ctaRect = cta.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const ctaVisible =
          ctaRect.top < viewportHeight * 0.85 && ctaRect.bottom > 0;

        if (ctaVisible) {
          const joinReveal = Math.min(
            1,
            Math.max(0, (viewportHeight * 0.72 - ctaRect.top) / 160)
          );
          trunkFillPx = Math.max(
            trunkFillPx,
            Math.min(trunkExtentPx, ctaNodeOffsetPx + joinReveal * 28)
          );
        }
      }

      let { activeIndex, branchProgress, nodeFillProgress } = computeProgress(
        containerRect,
        trunkFillPx,
        anchorY
      );

      const activeElement = getNode(activeIndex);
      if (activeElement) {
        const activeTop =
          activeElement.getBoundingClientRect().top - containerRect.top + NODE_Y;
        const fillForActive = activeTop - TRUNK_START_Y;
        trunkFillPx = Math.max(
          trunkFillPx,
          Math.min(trunkExtentPx, fillForActive)
        );
      }

      if (cta && ctaNodeOffsetPx !== null) {
        const ctaRect = cta.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const ctaVisible =
          ctaRect.top < viewportHeight * 0.85 && ctaRect.bottom > 0;

        if (ctaVisible) {
          const joinReveal = Math.min(
            1,
            Math.max(0, (viewportHeight * 0.72 - ctaRect.top) / 160)
          );
          trunkFillPx = Math.max(
            trunkFillPx,
            Math.min(trunkExtentPx, ctaNodeOffsetPx + joinReveal * 28)
          );
          if (joinReveal > 0.08) {
            activeIndex = Math.max(activeIndex, stepCount);
          }
        }
      }

      ({ activeIndex, branchProgress, nodeFillProgress } = computeProgress(
        containerRect,
        trunkFillPx,
        anchorY
      ));

      if (cta && ctaNodeOffsetPx !== null) {
        const ctaRect = cta.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        if (ctaRect.top < viewportHeight * 0.85 && ctaRect.bottom > 0) {
          activeIndex = Math.max(activeIndex, stepCount);
        }
      }

      setTimeline((prev) => {
        const prevBranches = prev.branchProgress ?? [];
        const prevFills = prev.nodeFillProgress ?? [];
        const sameFill = prev.trunkFillPx === trunkFillPx;
        const sameExtent = prev.trunkExtentPx === trunkExtentPx;
        const sameTrack = prev.trunkTrackPx === trunkTrackPx;
        const sameTail =
          Math.abs((prev.ctaTailProgress ?? 0) - ctaTailProgress) < 0.02;
        const sameActive = prev.activeIndex === activeIndex;
        const sameBranches =
          prevBranches.length === branchProgress.length &&
          prevBranches.every(
            (value, i) => Math.abs(value - branchProgress[i]) < 0.02
          );
        const sameNodeFills =
          prevFills.length === nodeFillProgress.length &&
          prevFills.every(
            (value, i) => Math.abs(value - nodeFillProgress[i]) < 0.02
          );

        if (
          sameFill &&
          sameExtent &&
          sameTrack &&
          sameTail &&
          sameActive &&
          sameBranches &&
          sameNodeFills
        ) {
          return prev;
        }

        return {
          trunkFillPx,
          trunkExtentPx,
          trunkTrackPx,
          ctaTailProgress,
          activeIndex,
          branchProgress,
          nodeFillProgress
        };
      });
    };

    const onScrollOrResize = (): void => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateTimeline);
    };

    updateTimeline();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [ctaRef, nodeCount, stepCount, stepRefs, timelineRef]);

  return timeline;
}

export function BranchTrunk({
  trunkTrackPx,
  trunkFillPx,
  trunkExtentPx,
  rootNodeFill,
  rootActive,
  tone = 'dark'
}: {
  trunkTrackPx: number;
  trunkFillPx: number;
  trunkExtentPx: number;
  rootNodeFill: number;
  rootActive: boolean;
  tone?: 'light' | 'dark';
}): React.JSX.Element {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-0 hidden lg:block"
      style={{ height: trunkTrackPx > 0 ? trunkTrackPx + TRUNK_START_Y : undefined }}
    >
      <div className="mx-auto h-full max-w-6xl px-6">
        <div className="relative h-full w-20">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
            main
          </p>
          <div
            className="absolute top-[1.375rem] z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: TRUNK_X }}
          >
            <BranchNode fillProgress={rootNodeFill} active={rootActive} tone={tone} />
          </div>
          <div
            className="absolute w-0.5 bg-white/10"
            style={{
              left: TRUNK_X,
              top: '1.75rem',
              height: trunkTrackPx
            }}
          />
          <div
            className="absolute w-0.5 bg-accent will-change-[height]"
            style={{
              left: TRUNK_X,
              top: '1.75rem',
              height: trunkFillPx
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function MobileBranchProgress({
  labels,
  activeIndex,
  nodeFillValues,
  className
}: {
  labels: string[];
  activeIndex: number;
  nodeFillValues: number[];
  className?: string;
}): React.JSX.Element {
  return (
    <div aria-hidden className={cn('mb-12 flex items-center gap-0', className)}>
      {labels.map((label, index) => {
        const fill = nodeFillValues[index] ?? 0;
        const isActive = index === activeIndex;
        const isPassed = index < activeIndex;

        return (
          <div key={label} className="flex flex-1 items-center">
            <BranchNode
              fillProgress={isPassed ? 1 : fill}
              active={isActive}
              tone="dark"
              className="shrink-0"
            />
            {index < labels.length - 1 ? (
              <span
                className={cn(
                  'mx-1 h-px flex-1 transition-colors duration-150',
                  isPassed || fill >= 1 ? 'bg-accent' : 'bg-white/10'
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function BranchConnector({
  active,
  passed,
  branchProgress,
  nodeFillProgress,
  label,
  tone = 'dark'
}: {
  active: boolean;
  passed: boolean;
  branchProgress: number;
  nodeFillProgress: number;
  label: string;
  tone?: 'light' | 'dark';
}): React.JSX.Element {
  const branchLength = PILL_X - TRUNK_X;
  const drawProgress = passed ? 1 : branchProgress;
  const dashOffset = branchLength * (1 - drawProgress);
  const isDark = tone === 'dark';

  const pillClass = cn(
    'absolute z-10 -translate-y-1/2 rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide',
    isDark
      ? active
        ? 'border-white/50 bg-white/10 text-white'
        : passed || drawProgress > 0.6
          ? 'border-white/30 text-white/75'
          : 'border-white/15 text-white/40'
      : active
        ? 'border-foreground/20 bg-foreground/[0.04] text-foreground'
        : passed || drawProgress > 0.6
          ? 'border-foreground/14 text-foreground/70'
          : 'border-foreground/12 text-foreground/40'
  );

  const pillStyle = { left: PILL_X, top: NODE_Y } as const;

  return (
    <div className="absolute left-0 top-0 hidden h-7 min-w-36 overflow-visible lg:block">
      <svg
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-0 overflow-visible"
        width={PILL_X + 8}
        height="24"
        viewBox={`0 0 ${PILL_X + 8} 24`}
        fill="none"
      >
        <path
          d={branchToPillPath()}
          stroke={isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(6, 6, 7, 0.1)'}
          strokeWidth="2"
          strokeLinecap="butt"
          fill="none"
        />
        <path
          d={branchToPillPath()}
          stroke="#dc143c"
          strokeWidth="2"
          strokeLinecap="butt"
          pathLength={branchLength}
          strokeDasharray={branchLength}
          strokeDashoffset={dashOffset}
          fill="none"
        />
      </svg>

      <div
        aria-hidden
        className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
        style={{ left: TRUNK_X, top: NODE_Y }}
      >
        <BranchNode
          active={active}
          fillProgress={passed ? 1 : nodeFillProgress}
          tone={tone}
        />
      </div>

      <span
        aria-hidden
        className={cn(pillClass, 'pointer-events-none whitespace-nowrap')}
        style={pillStyle}
      >
        {label}
      </span>
    </div>
  );
}

export function BranchNode({
  active = false,
  fillProgress,
  tone = 'dark',
  className
}: {
  active?: boolean;
  fillProgress: number;
  tone?: 'light' | 'dark';
  className?: string;
}): React.JSX.Element {
  const isDark = tone === 'dark';
  const fill = Math.max(0, Math.min(1, fillProgress));
  const filled = fill >= 0.98;

  return (
    <span
      className={cn(
        'relative block rounded-full border-2 transition-[border-color,box-shadow] duration-150',
        active ? 'size-3' : 'size-2.5',
        filled
          ? 'border-accent'
          : isDark
            ? 'border-white/25'
            : 'border-foreground/15',
        active && 'shadow-[0_0_0_5px_rgb(220_20_60_/_0.2)]',
        className
      )}
    >
      <span
        className={cn(
          'absolute inset-0 rounded-full',
          isDark ? 'bg-foreground' : 'bg-foreground'
        )}
      />
      <span
        className="absolute inset-0 rounded-full bg-accent will-change-transform"
        style={{
          transform: `scale(${fill})`,
          transformOrigin: 'center'
        }}
      />
    </span>
  );
}
