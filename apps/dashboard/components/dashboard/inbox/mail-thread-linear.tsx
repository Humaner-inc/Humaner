'use client';

import * as React from 'react';
import { ArrowUpRightIcon } from '@humaner/shared/icons';
import { toast } from 'sonner';

import {
  createLinearFromThread,
  linkLinearToThread,
  listThreadLinearLinks
} from '@/actions/inbox/manage-linear-thread';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSafeActionErrorMessage } from '@/lib/safe-action-error';

type LinearLink = {
  id: string;
  identifier: string;
  title: string;
  url: string;
};

export function MailThreadLinear({
  threadId,
  subject
}: {
  threadId: string;
  subject: string;
}): React.JSX.Element {
  const [links, setLinks] = React.useState<LinearLink[]>([]);
  const [query, setQuery] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(async (): Promise<void> => {
    const result = await listThreadLinearLinks({ threadId });
    setLinks(result?.data?.links ?? []);
  }, [threadId]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const createIssue = async (): Promise<void> => {
    setBusy(true);
    try {
      const result = await createLinearFromThread({
        threadId,
        title: subject
      });
      if (result?.data && 'ok' in result.data && result.data.ok) {
        toast.success('Linear issue created');
        await refresh();
        return;
      }
      toast.error(
        getSafeActionErrorMessage(result, 'Could not create Linear issue')
      );
    } finally {
      setBusy(false);
    }
  };

  const linkIssue = async (): Promise<void> => {
    if (!query.trim()) return;
    setBusy(true);
    try {
      const result = await linkLinearToThread({
        threadId,
        issueId: query.trim()
      });
      if (result?.data && 'ok' in result.data && result.data.ok) {
        toast.success('Linear issue linked');
        setQuery('');
        await refresh();
        return;
      }
      toast.error(
        getSafeActionErrorMessage(result, 'Could not link Linear issue')
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-lg border border-foreground/10 bg-muted/20 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Linear
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 font-mono text-[10px]"
          disabled={busy}
          onClick={() => void createIssue()}
        >
          Create issue
        </Button>
      </div>
      {links.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {links.map((link) => (
            <li key={link.id}>
              <a
                href={link.url || undefined}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm hover:underline"
              >
                <span className="font-mono text-[11px] text-muted-foreground">
                  {link.identifier}
                </span>
                <span className="min-w-0 truncate">{link.title}</span>
                <ArrowUpRightIcon className="size-3 shrink-0 text-muted-foreground" />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-xs text-muted-foreground">
          No issue on this thread yet.
        </p>
      )}
      <form
        className="mt-2 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void linkIssue();
        }}
      >
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Link ENG-123"
          className="h-8 font-mono text-xs"
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="h-8 font-mono"
          disabled={busy || !query.trim()}
        >
          Link
        </Button>
      </form>
    </section>
  );
}
