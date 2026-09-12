'use client';

import * as React from 'react';
import { FileTextIcon } from '@humaner/shared/icons';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import {
  saveMailThreadNoteDraft,
  sendMailThreadNoteAction
} from '@/actions/inbox/manage-mail-notes';
import { FeatureIntroEmpty } from '@/components/dashboard/desk/feature-intro-empty';
import {
  MentionBody,
  MentionComposer
} from '@/components/dashboard/team/mention-composer';
import { Button } from '@/components/ui/button';
import type { MailThreadDetail } from '@/data/inbox/get-mail-threads';
import type { MentionMember } from '@/lib/inbox/mentions';
import { cn } from '@/lib/utils';

export function MailThreadNotesPanel({
  threadId,
  notes,
  sharedNoteDraft,
  members,
  compact = false,
  inline = false,
  onNoteSent
}: {
  threadId: string;
  notes: MailThreadDetail['notes'];
  sharedNoteDraft: string | null;
  members: MentionMember[];
  compact?: boolean;
  inline?: boolean;
  onNoteSent?: (note: MailThreadDetail['notes'][number]) => void;
}): React.JSX.Element {
  const [draft, setDraft] = React.useState(sharedNoteDraft ?? '');
  const [sentNotes, setSentNotes] = React.useState(notes);
  const onNoteSentRef = React.useRef(onNoteSent);
  onNoteSentRef.current = onNoteSent;

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
        onNoteSentRef.current?.(data);
        toast.success('Note shared with the team');
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

  const submit = (): void => {
    if (!draft.trim()) return;
    sendNote({ threadId, body: draft });
  };

  return (
    <section
      className={cn(
        'flex min-h-0 flex-col',
        inline
          ? undefined
          : compact
            ? 'h-full'
            : 'border-t border-border/60 px-5 py-4'
      )}
    >
      {compact || inline ? null : (
        <>
          <p className="text-xs text-muted-foreground">Notes</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Attached to this subject. @mention a teammate to notify them.
          </p>
        </>
      )}
      {sentNotes.length === 0 ? (
        inline ? (
          <p className="px-1 pb-2 text-xs text-muted-foreground">
            No notes on this subject yet.
          </p>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center px-3">
            <FeatureIntroEmpty
              compact
              icon={<FileTextIcon strokeWidth={1.25} />}
              title="No notes yet"
              description="Notes stay on this subject. @mention a teammate to notify them."
            />
          </div>
        )
      ) : (
        <ul
          className={cn(
            'min-h-0 space-y-2 overflow-y-auto',
            inline ? 'pb-2' : compact ? 'flex-1 px-3 py-3' : 'mt-3 flex-1'
          )}
        >
          {sentNotes.map((note) => (
            <li
              key={note.id}
              className="rounded-lg border border-border/50 px-3 py-2"
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
              <p className="mt-1 text-sm">
                <MentionBody
                  body={note.body}
                  members={members}
                />
              </p>
            </li>
          ))}
        </ul>
      )}
      <div
        className={cn(
          compact && !inline ? 'border-t border-border/50 p-3' : undefined
        )}
      >
        <MentionComposer
          value={draft}
          onChange={setDraft}
          members={members}
          placeholder="Write a note… use @ to mention"
          rows={compact ? 3 : 3}
          onSubmit={submit}
        />
        <div className="mt-2 flex justify-end">
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5 px-3 font-mono text-[11px] normal-case tracking-normal"
            disabled={sending || draft.trim().length === 0}
            onClick={submit}
          >
            Send note
          </Button>
        </div>
      </div>
    </section>
  );
}
