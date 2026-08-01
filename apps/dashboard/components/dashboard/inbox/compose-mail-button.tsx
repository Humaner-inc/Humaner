'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon } from '@humaner/shared/icons';

import { useComposeMail } from '@/components/dashboard/inbox/compose-mail-context';
import { Button } from '@/components/ui/button';
import type { MailInboxOption } from '@/data/inbox/get-mail-threads';
import { cn } from '@/lib/utils';

export function ComposeMailButton({
  defaultAliasId = null,
  className,
  autoOpen = false,
  /** Kept for callers that still pass inboxes; dialog uses layout provider. */
  inboxes: _inboxes
}: {
  inboxes?: MailInboxOption[];
  defaultAliasId?: string | null;
  className?: string;
  /** Open the dialog on mount (e.g. from ?compose=1). */
  autoOpen?: boolean;
}): React.JSX.Element {
  const router = useRouter();
  const { inboxes, openCompose } = useComposeMail();
  const didAutoOpen = React.useRef(false);

  React.useEffect(() => {
    if (!autoOpen || didAutoOpen.current) return;
    didAutoOpen.current = true;
    openCompose(defaultAliasId);
    const url = new URL(window.location.href);
    if (url.searchParams.has('compose')) {
      url.searchParams.delete('compose');
      router.replace(`${url.pathname}${url.search}${url.hash}`);
    }
  }, [autoOpen, defaultAliasId, openCompose, router]);

  return (
    <Button
      type="button"
      size="sm"
      className={cn(
        'h-9 gap-1.5 rounded-none px-3 font-mono text-[11px]',
        className
      )}
      disabled={inboxes.length === 0}
      onClick={() => openCompose(defaultAliasId)}
    >
      <PlusIcon className="size-3.5" />
      Compose
    </Button>
  );
}
