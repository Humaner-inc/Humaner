'use client';

import * as React from 'react';
import { PinIcon, Trash2Icon } from '@humaner/shared/icons';

import { playUiFeedbackSound } from '@/lib/sounds/ui-feedback-sound';
import { cn } from '@/lib/utils';

import styles from './mail-thread-row-swipe.module.css';

const SLOP_PX = 8;
/** Commit pin/delete when the row travels this fraction of its width. */
const COMMIT_FRACTION = 0.4;
const DELETE_EXIT_MS = 420;
const PIN_SETTLE_MS = 380;
const EASE_OUT_POWER = 2.35;

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

/** Maps finger travel to row travel with ease-out so motion eases into the action zone. */
function pointerToVisualOffset(raw: number, rowWidth: number): number {
  const width = rowWidth || 320;
  const sign = Math.sign(raw) || 1;
  const abs = Math.abs(raw);
  const commitAt = Math.max(80, width * COMMIT_FRACTION);
  const maxTravel = width * 0.58;

  if (abs <= commitAt) {
    const t = abs / commitAt;
    const eased = 1 - Math.pow(1 - t, EASE_OUT_POWER);
    return sign * eased * commitAt;
  }

  const past = abs - commitAt;
  const tail = commitAt + past * 0.2;
  return sign * Math.min(tail, maxTravel);
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
  const [readyToCommit, setReadyToCommit] = React.useState(false);

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

  const commitDistance = (): number =>
    Math.max(80, widthRef.current * COMMIT_FRACTION);

  const collapseRow = React.useCallback((): void => {
    const row = rowRef?.current;
    if (!row) return;
    const height = row.getBoundingClientRect().height;
    row.style.maxHeight = `${height}px`;
    row.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      row.style.transition =
        'max-height 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms cubic-bezier(0, 0, 0.2, 1), border-color 320ms ease-out';
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
      setReadyToCommit(false);
      const reduced = prefersReducedMotion();

      if (side === 'delete') {
        playUiFeedbackSound('mail-delete');
        const width = widthRef.current || 320;
        setExitMode('delete');
        setOffsetX(-(width + 32));
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
    (fingerRaw: number): void => {
      const threshold = commitDistance();
      const distance = Math.abs(fingerRaw);
      setDragging(false);
      setReadyToCommit(false);

      if (distance >= threshold) {
        if (fingerRaw > 0) runAction('pin');
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
    setReadyToCommit(false);
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

    const fingerRaw = drag.originX + event.clientX - drag.startX;
    const visual = pointerToVisualOffset(fingerRaw, widthRef.current);
    setOffsetX(visual);
    setReadyToCommit(Math.abs(fingerRaw) >= commitDistance());
  };

  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const axis = drag.axis;
    dragRef.current = null;
    if (axis === 'x') {
      const fingerRaw = drag.originX + event.clientX - drag.startX;
      finishDrag(fingerRaw);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }
    setDragging(false);
    setReadyToCommit(false);
  };

  if (!enabled) {
    return <>{children}</>;
  }

  const revealPin = offsetX > 0;
  const revealDelete = offsetX < 0;
  const threshold = commitDistance();
  const revealWidth = Math.min(Math.abs(offsetX), threshold * 1.05);
  const progress = Math.min(Math.abs(offsetX) / threshold, 1);

  return (
    <div
      ref={surfaceRef}
      className="relative overflow-hidden"
      data-no-pull
    >
      <div
        aria-hidden
        data-dragging={dragging || undefined}
        data-ready={readyToCommit && revealPin ? true : undefined}
        className={cn(
          styles.panel,
          'pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center bg-[#f5a524] text-[#0a0d0d]'
        )}
        style={{
          width: revealPin ? revealWidth : 0,
          opacity: revealPin ? 0.35 + progress * 0.65 : 0
        }}
      >
        <div
          className="flex flex-col items-center gap-1 px-2 transition-transform duration-200 ease-out"
          style={{
            transform: revealPin
              ? `scale(${0.88 + progress * 0.12})`
              : 'scale(0.88)'
          }}
        >
          <PinIcon className="size-5" />
          <span className="font-mono text-[10px] font-medium">{pinLabel}</span>
        </div>
      </div>
      <div
        aria-hidden
        data-dragging={dragging || undefined}
        data-ready={readyToCommit && revealDelete ? true : undefined}
        className={cn(
          styles.panel,
          'pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center bg-destructive text-destructive-foreground'
        )}
        style={{
          width: revealDelete ? revealWidth : 0,
          opacity: revealDelete ? 0.35 + progress * 0.65 : 0
        }}
      >
        <div
          className="flex flex-col items-center gap-1 px-2 transition-transform duration-200 ease-out"
          style={{
            transform: revealDelete
              ? `scale(${0.88 + progress * 0.12})`
              : 'scale(0.88)'
          }}
        >
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
