'use client';

import * as React from 'react';
import { PinIcon, Trash2Icon } from '@humaner/shared/icons';

import { playUiFeedbackSound } from '@/lib/sounds/ui-feedback-sound';
import { cn } from '@/lib/utils';

import styles from './mail-thread-row-swipe.module.css';

const SLOP_PX = 8;
const COMMIT_FRACTION = 1 / 3;
const DELETE_EXIT_MS = 360;
const PIN_SETTLE_MS = 320;

type MailThreadRowSwipeProps = {
  enabled: boolean;
  pinLabel: string;
  deleteLabel: string;
  rowRef?: React.RefObject<HTMLLIElement | null>;
  onPin: () => void;
  onDelete: () => void;
  children: React.ReactNode;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  axis: 'x' | 'y' | null;
};

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function MailThreadRowSwipe({
  enabled,
  pinLabel,
  deleteLabel,
  rowRef,
  onPin,
  onDelete,
  children
}: MailThreadRowSwipeProps): React.JSX.Element {
  const surfaceRef = React.useRef<HTMLDivElement>(null);
  const widthRef = React.useRef(0);
  const dragRef = React.useRef<DragState | null>(null);
  const committedRef = React.useRef(false);
  const [offsetX, setOffsetX] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const [exitMode, setExitMode] = React.useState<'delete' | null>(null);

  const measureWidth = React.useCallback((): void => {
    const node = surfaceRef.current;
    if (!node) return;
    widthRef.current = node.offsetWidth;
  }, []);

  React.useEffect(() => {
    measureWidth();
    const node = surfaceRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() => measureWidth());
    observer.observe(node);
    return () => observer.disconnect();
  }, [measureWidth]);

  const commitThreshold = (): number =>
    Math.max(72, widthRef.current * COMMIT_FRACTION);

  const clampOffset = (raw: number): number => {
    const max = widthRef.current || 320;
    const sign = Math.sign(raw) || 1;
    const distance = Math.min(Math.abs(raw), max);
    return sign * distance;
  };

  const offsetWithResistance = (raw: number): number => {
    const clamped = clampOffset(raw);
    const threshold = commitThreshold();
    const abs = Math.abs(clamped);
    if (abs <= threshold) return clamped;
    const overshoot = abs - threshold;
    const resisted = threshold + overshoot * 0.28;
    const cap = (widthRef.current || 320) * 0.5;
    return Math.sign(clamped) * Math.min(resisted, cap);
  };

  const collapseRow = React.useCallback((): void => {
    const row = rowRef?.current;
    if (!row) return;
    const height = row.getBoundingClientRect().height;
    row.style.maxHeight = `${height}px`;
    row.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      row.style.transition =
        'max-height 360ms cubic-bezier(0.4, 0, 1, 1), opacity 300ms ease-in, border-color 300ms ease-in';
      row.style.maxHeight = '0px';
      row.style.opacity = '0';
      row.style.borderColor = 'transparent';
    });
  }, [rowRef]);

  const runAction = React.useCallback(
    (side: 'pin' | 'delete'): void => {
      if (committedRef.current) return;
      committedRef.current = true;
      setDragging(false);
      const reduced = prefersReducedMotion();

      if (side === 'delete') {
        playUiFeedbackSound('mail-delete');
        const width = widthRef.current || 320;
        setExitMode('delete');
        setOffsetX(-(width + 28));
        collapseRow();
        window.setTimeout(
          () => {
            onDelete();
            committedRef.current = false;
            setExitMode(null);
            setOffsetX(0);
          },
          reduced ? 0 : DELETE_EXIT_MS
        );
        return;
      }

      playUiFeedbackSound('mail-pin');
      setOffsetX(0);
      const row = rowRef?.current;
      if (row) row.classList.add(styles.pinPulse);
      window.setTimeout(
        () => {
          onPin();
          if (row) row.classList.remove(styles.pinPulse);
          committedRef.current = false;
        },
        reduced ? 0 : PIN_SETTLE_MS
      );
    },
    [collapseRow, onDelete, onPin, rowRef]
  );

  const finishDrag = React.useCallback(
    (raw: number): void => {
      const threshold = commitThreshold();
      const distance = Math.abs(raw);
      setDragging(false);
      if (distance >= threshold) {
        if (raw > 0) runAction('pin');
        else runAction('delete');
        return;
      }
      setOffsetX(0);
    },
    [runAction]
  );

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (!enabled || !event.isPrimary || committedRef.current) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    measureWidth();
    setDragging(false);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offsetX,
      axis: null
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (!drag.axis) {
      if (Math.hypot(dx, dy) < SLOP_PX) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.axis = 'y';
        dragRef.current = null;
        return;
      }
      drag.axis = 'x';
      drag.startX = event.clientX;
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    const next = offsetWithResistance(
      drag.originX + event.clientX - drag.startX
    );
    setOffsetX(next);

    const threshold = commitThreshold();
    if (Math.abs(next) >= threshold) {
      if (next > 0) runAction('pin');
      else runAction('delete');
      dragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const axis = drag.axis;
    dragRef.current = null;
    if (axis === 'x') {
      const finalOffset = offsetWithResistance(
        drag.originX + event.clientX - drag.startX
      );
      setOffsetX(finalOffset);
      finishDrag(finalOffset);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }
    setDragging(false);
  };

  if (!enabled) {
    return <>{children}</>;
  }

  const revealPin = offsetX > 0;
  const revealDelete = offsetX < 0;
  const threshold = commitThreshold();
  const revealWidth = Math.min(Math.abs(offsetX), threshold);

  return (
    <div
      ref={surfaceRef}
      className="relative overflow-hidden"
      data-no-pull
    >
      <div
        aria-hidden
        data-dragging={dragging || undefined}
        className={cn(
          styles.panel,
          'pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center bg-[#f5a524] text-[#0a0d0d]',
          revealPin ? 'opacity-100' : 'opacity-0'
        )}
        style={{ width: revealWidth }}
      >
        <div className="flex flex-col items-center gap-1 px-2">
          <PinIcon className="size-5" />
          <span className="font-mono text-[10px] font-medium">{pinLabel}</span>
        </div>
      </div>
      <div
        aria-hidden
        data-dragging={dragging || undefined}
        className={cn(
          styles.panel,
          'pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center bg-destructive text-destructive-foreground',
          revealDelete ? 'opacity-100' : 'opacity-0'
        )}
        style={{ width: revealWidth }}
      >
        <div className="flex flex-col items-center gap-1 px-2">
          <Trash2Icon className="size-5" />
          <span className="font-mono text-[10px] font-medium">
            {deleteLabel}
          </span>
        </div>
      </div>
      <div
        data-dragging={dragging || undefined}
        data-exit={exitMode ?? undefined}
        className={cn(
          styles.sheet,
          'relative touch-pan-y bg-inherit will-change-transform',
          exitMode === 'delete' && 'opacity-0'
        )}
        style={{ transform: `translate3d(${offsetX}px, 0, 0)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        {children}
      </div>
    </div>
  );
}
