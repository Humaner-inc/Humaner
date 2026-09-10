'use client';

import * as React from 'react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import {
  saveMailThreadNoteDraft,
  sendMailThreadNoteAction
} from '@/actions/inbox/manage-mail-notes';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { MailThreadDetail } from '@/data/inbox/get-mail-threads';

export function MailThreadNotesPanel({
  threadId,
  notes,
  sharedNoteDraft
}: {
  threadId: string;
  notes: MailThreadDetail['notes'];
  sharedNoteDraft: string | null;
}): React.JSX.Element {
  const [draft, setDraft] = React.useState(sharedNoteDraft ?? '');
  const [sentNotes, setSentNotes] = React.useState(notes);

  React.useEffect(() => {
    setDraft(sharedNoteDraft ?? '');
    setSentNotes(notes);
  }, [notes, sharedNoteDraft, threadId]);

  const { execute: saveDraft } = useAction(saveMailThreadNoteDraft);
  const { execute: sendNote, isExecuting: sending } = useAction(
    sendMailThreadNoteAction,
    {
      onSuccess: ({ data }) => {
        if (!data) return;
        setSentNotes((current) => [...current, data]);
        setDraft('');
        toast.success('Note saved');
      },
      onError: ({ error }) =>
        toast.error(error.serverError || 'Could not send note')
    }
  );

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      if (draft === (sharedNoteDraft ?? '')) return;
      saveDraft({ threadId, body: draft });
    }, 600);
    return () => window.clearTimeout(handle);
  }, [draft, saveDraft, sharedNoteDraft, threadId]);

  return (
    <section className="border-t border-border/60 px-5 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        Notes
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Shared with the team. Companion never sends these.
      </p>
      {sentNotes.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {sentNotes.map((note) => (
            <li
              key={note.id}
              className="border border-border/50 px-3 py-2"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {note.authorName} ·{' '}
                {new Date(note.createdAt).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{note.body}</p>
            </li>
          ))}
        </ul>
      ) : null}
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Write a shared note…"
        rows={3}
        className="mt-3 rounded-none"
      />
      <div className="mt-2 flex justify-end">
        <Button
          type="button"
          size="sm"
          className="h-8 rounded-none px-3 font-mono text-xs"
          disabled={sending || draft.trim().length === 0}
          onClick={() => sendNote({ threadId, body: draft })}
        >
          Send note
        </Button>
      </div>
    </section>
  );
}
