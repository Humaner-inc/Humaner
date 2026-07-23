'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckIcon, ChevronDownIcon } from '@humaner/shared/icons';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import type { MailInboxOption } from '@/data/inbox/get-mail-threads';
import { cn } from '@/lib/utils';

export function InboxDomainSwitcher({
  inboxes,
  activeAliasId
}: {
  inboxes: MailInboxOption[];
  activeAliasId: string | null;
}): React.JSX.Element | null {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  if (inboxes.length === 0) return null;

  const active = inboxes.find((inbox) => inbox.id === activeAliasId) ?? null;
  const singleLabel = inboxes[0]?.address ?? '';
  const multiLabel = active?.address ?? 'All inboxes';

  if (inboxes.length === 1) {
    return (
      <p
        className="max-w-[18rem] truncate text-right font-mono text-xs text-muted-foreground"
        title={singleLabel}
      >
        {singleLabel}
      </p>
    );
  }

  const hrefFor = (aliasId: string | null): string => {
    if (!aliasId) return pathname;
    return `${pathname}?alias=${aliasId}`;
  };

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
    >
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 max-w-[18rem] gap-1.5 px-2 font-mono text-xs text-muted-foreground"
          title={multiLabel}
        >
          <span className="truncate">{multiLabel}</span>
          <ChevronDownIcon className="size-3.5 shrink-0" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-sm"
      >
        <SheetHeader>
          <SheetTitle className="font-display text-left">Inboxes</SheetTitle>
        </SheetHeader>
        <ul className="mt-6 space-y-1">
          <li>
            <Link
              href={hrefFor(null)}
              onClick={() => setOpen(false)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted',
                !activeAliasId && 'bg-muted font-medium'
              )}
            >
              <span className="min-w-0 flex-1 truncate">All inboxes</span>
              {!activeAliasId ? (
                <CheckIcon className="size-3.5 shrink-0 text-emerald-600" />
              ) : null}
            </Link>
          </li>
          {inboxes.map((inbox) => {
            const selected = activeAliasId === inbox.id;
            return (
              <li key={inbox.id}>
                <Link
                  href={hrefFor(inbox.id)}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted',
                    selected && 'bg-muted font-medium'
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {inbox.address}
                  </span>
                  {selected ? (
                    <CheckIcon className="size-3.5 shrink-0 text-emerald-600" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
