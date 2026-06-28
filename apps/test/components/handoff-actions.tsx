'use client';

import * as React from 'react';

export type HandoffPayload = {
  humanDesk: boolean;
  email: string | null;
};

type HandoffTurn = { role: 'user' | 'assistant'; content: string };

type HandoffActionsProps = {
  handoff: HandoffPayload;
  accentColor: string;
  agentId: string;
  sessionId: string;
  getHistory: () => HandoffTurn[];
};

type Mode = 'idle' | 'form' | 'submitting' | 'done';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildMailto(email: string, history: HandoffTurn[]): string {
  const lastUser = [...history].reverse().find((turn) => turn.role === 'user');
  const subject = 'Support request';
  const intro = "Hi, I need help with the following and couldn't resolve it in chat:";
  const body = lastUser ? `${intro}\n\n${lastUser.content}` : intro;
  return `mailto:${email}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

export function HandoffActions({
  handoff,
  accentColor,
  agentId,
  sessionId,
  getHistory
}: HandoffActionsProps): React.JSX.Element | null {
  const [mode, setMode] = React.useState<Mode>('idle');
  const [email, setEmail] = React.useState('');
  const [note, setNote] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const canCreateTicket = handoff.humanDesk;
  const canEmail = Boolean(handoff.email);

  if (!canCreateTicket && !canEmail) {
    return null;
  }

  const submitTicket = async (): Promise<void> => {
    const trimmed = email.trim();
    if (!EMAIL_REGEX.test(trimmed)) {
      setError('Please enter a valid email so the team can reach you.');
      return;
    }
    setError(null);
    setMode('submitting');
    try {
      const response = await fetch('/api/handoff/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          sessionId,
          visitorEmail: trimmed,
          note: note.trim() || undefined,
          history: getHistory()
        })
      });
      if (!response.ok) {
        let detail = 'Could not create the ticket. Please try again.';
        try {
          const data = (await response.json()) as { error?: string };
          if (data.error) {
            detail = data.error;
          }
        } catch {
          // ignore non-JSON error bodies
        }
        throw new Error(detail);
      }
      setMode('done');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not create the ticket. Please try again.'
      );
      setMode('form');
    }
  };

  if (mode === 'done') {
    return (
      <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/85">
        <p className="font-medium">Got it — your request is with the team.</p>
        <p className="mt-1 text-white/55">
          Someone will follow up at {email.trim()}.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      {mode === 'idle' && (
        <div className="flex flex-wrap gap-2">
          {canCreateTicket && (
            <button
              type="button"
              onClick={() => setMode('form')}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: accentColor }}
            >
              Create a ticket
            </button>
          )}
          {canEmail && handoff.email && (
            <a
              href={buildMailto(handoff.email, getHistory())}
              className="rounded-full border bg-white/5 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10"
              style={{ borderColor: accentColor, color: accentColor }}
            >
              Send an email
            </a>
          )}
        </div>
      )}

      {(mode === 'form' || mode === 'submitting') && (
        <div className="rounded-xl border border-white/10 bg-black/25 p-3">
          <p className="text-xs font-medium text-white/90">
            Leave your email and the team will take it from here.
          </p>
          <input
            type="email"
            value={email}
            disabled={mode === 'submitting'}
            placeholder="you@example.com"
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:ring-2 focus:ring-white/20"
          />
          <textarea
            value={note}
            rows={2}
            disabled={mode === 'submitting'}
            placeholder="Anything else we should know? (optional)"
            onChange={(event) => setNote(event.target.value)}
            className="mt-2 max-h-28 w-full resize-none rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:ring-2 focus:ring-white/20"
          />
          {error && <p className="mt-1.5 text-xs text-red-300">{error}</p>}
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void submitTicket()}
              disabled={mode === 'submitting'}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: accentColor }}
            >
              {mode === 'submitting' ? 'Sending…' : 'Submit ticket'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('idle');
                setError(null);
              }}
              disabled={mode === 'submitting'}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-white/55 transition-colors hover:text-white/80 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
