'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { XIcon } from '@humaner/shared/icons';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';

import { dashboardSecondaryRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

const SEARCH_DEBOUNCE_MS = 250;

/**
 * Mail search as a magnifier button — same chrome as the sidebar's reduce /
 * extend control — that grows into a search field on click. The query lives in
 * `?q=` so the server list stays the source of truth (it reaches past the
 * loaded rows on big mailboxes); typing stays instant because the URL update
 * is debounced and runs in a transition.
 */
export function InboxSearchBar({
  open,
  onOpenChange,
  className
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';
  const [value, setValue] = React.useState(urlQuery);
  const [, startTransition] = React.useTransition();
  const timerRef = React.useRef<number | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Keep the field in step with back/forward and folder switches.
  React.useEffect(() => {
    setValue(urlQuery);
  }, [urlQuery]);

  React.useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  React.useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    []
  );

  const commit = React.useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = next.trim();
      if (trimmed) params.set('q', trimmed);
      else params.delete('q');
      params.delete('thread');
      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false
        });
      });
    },
    [pathname, router, searchParams]
  );

  const onChange = (next: string): void => {
    setValue(next);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(
      () => commit(next),
      SEARCH_DEBOUNCE_MS
    );
  };

  const close = (): void => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    if (value || urlQuery) {
      setValue('');
      commit('');
    }
    onOpenChange(false);
  };

  return (
    <form
      role="search"
      className={cn(
        'flex min-w-0 items-center justify-end',
        open ? 'flex-1' : 'ml-auto shrink-0',
        className
      )}
      onSubmit={(event) => {
        event.preventDefault();
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        commit(value);
      }}
    >
      <div
        className={cn(
          'relative flex h-8 items-center overflow-hidden border border-foreground/10 bg-foreground/[0.04] text-foreground/55 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.12)] backdrop-blur-xl backdrop-saturate-150 transition-[width,color,background-color,border-color] duration-200 focus-within:border-foreground/25 focus-within:text-foreground',
          open
            ? 'w-full'
            : 'w-8 hover:border-foreground/25 hover:bg-foreground/[0.10] hover:text-foreground',
          dashboardSecondaryRadiusClassName
        )}
      >
        <button
          type="button"
          aria-label="Search mail"
          aria-expanded={open}
          tabIndex={open ? -1 : 0}
          onClick={() => onOpenChange(true)}
          className={cn(
            'flex size-8 shrink-0 items-center justify-center focus-visible:outline-none',
            open && 'pointer-events-none'
          )}
        >
          <MagnifyingGlass className="size-3.5" />
        </button>
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => {
            if (!value) onOpenChange(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              close();
            }
          }}
          placeholder="Search mail"
          aria-label="Search mail"
          autoComplete="off"
          spellCheck={false}
          tabIndex={open ? 0 : -1}
          className="min-w-0 flex-1 bg-transparent pr-7 font-mono text-[11px] text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        {open && value ? (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={close}
            aria-label="Clear search"
            className="absolute right-1 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground"
          >
            <XIcon className="size-3" />
          </button>
        ) : null}
      </div>
    </form>
  );
}
