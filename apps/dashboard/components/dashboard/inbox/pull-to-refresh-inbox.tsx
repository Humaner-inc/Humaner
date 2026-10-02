'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCwIcon } from '@humaner/shared/icons';
import { SquircleLoader } from '@humaner/shared/squircle-loader';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { syncInboxNow } from '@/actions/inbox/sync-inbox-now';
import { cn } from '@/lib/utils';

const PULL_THRESHOLD = 72;

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      'a, button, input, textarea, select, [role="button"], [role="menuitem"], [role="menu"], [data-radix-menu-content], [data-no-pull]'
    )
  );
}

export function PullToRefreshInbox({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  const router = useRouter();
  const startYRef = React.useRef<number | null>(null);
  const pullingRef = React.useRef(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const [ready, setReady] = React.useState(false);

  const { execute, isExecuting } = useAction(syncInboxNow, {
    onSuccess: ({ data }) => {
      const imported = data?.messages ?? 0;
      const syncErrors = data?.errors ?? 0;
      if (syncErrors > 0 && imported === 0) {
        toast.error('Mailbox sync hit an error. Try again in a few minutes.');
      } else {
        toast.success(
          imported > 0
            ? `Mailbox synced — ${imported} message${imported === 1 ? '' : 's'} checked`
            : 'Mailbox is up to date'
        );
      }
      router.refresh();
      setPullDistance(0);
      setReady(false);
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Could not sync mailbox');
      setPullDistance(0);
      setReady(false);
    }
  });

  const resetPull = (): void => {
    startYRef.current = null;
    pullingRef.current = false;
    setPullDistance(0);
    setReady(false);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (isExecuting) return;
    if (isInteractiveTarget(event.target)) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const target = event.currentTarget;
    if (target.scrollTop > 0) return;
    startYRef.current = event.clientY;
    pullingRef.current = true;
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (!pullingRef.current || startYRef.current == null || isExecuting) return;
    const delta = event.clientY - startYRef.current;
    if (delta <= 0) {
      setPullDistance(0);
      setReady(false);
      return;
    }
    const distance = Math.min(delta * 0.45, 110);
    setPullDistance(distance);
    setReady(distance >= PULL_THRESHOLD);
  };

  const onPointerUp = (): void => {
    if (!pullingRef.current) return;
    if (ready && !isExecuting) {
      execute({});
      setPullDistance(PULL_THRESHOLD);
    } else {
      resetPull();
    }
    pullingRef.current = false;
    startYRef.current = null;
  };

  const indicatorOffset = isExecuting ? PULL_THRESHOLD : pullDistance;

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={resetPull}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-12 items-end justify-center pb-2"
        style={{
          opacity: indicatorOffset > 8 || isExecuting ? 1 : 0,
          transform: `translateY(${Math.max(indicatorOffset - 48, -40)}px)`
        }}
      >
        <div className="inline-flex items-center gap-2 rounded-full border bg-background/95 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground shadow-sm backdrop-blur">
          {isExecuting || ready ? (
            <SquircleLoader />
          ) : (
            <RefreshCwIcon className="size-3.5" />
          )}
          {isExecuting
            ? 'Syncing…'
            : ready
              ? 'Release to sync'
              : 'Pull to sync'}
        </div>
      </div>

      <div
        className="transition-transform duration-150 ease-out"
        style={{
          transform: `translateY(${indicatorOffset}px)`
        }}
      >
        {children}
      </div>
    </div>
  );
}
