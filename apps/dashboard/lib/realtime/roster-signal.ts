// No `server-only` marker: lib/db/prisma.ts imports this, and plain-Node
// scripts (training, one-off tools) must still be able to load prisma.

/**
 * "The set of IMAP mailboxes changed" signal for the IDLE worker, so it reloads
 * its roster on demand instead of querying Neon on a timer.
 *
 * In the worker process: listeners fire directly. From Vercel: POST to the
 * realtime hub's /roster endpoint, which fires the listeners there.
 */
type Listener = () => void;

const listeners = new Set<Listener>();
let lastSentAt = 0;
const SEND_THROTTLE_MS = 10_000;

export function onMailboxRosterChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitMailboxRosterChangedLocal(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // a bad listener must not break the writer
    }
  }
}

let trailing: ReturnType<typeof setTimeout> | null = null;

function deliver(): void {
  lastSentAt = Date.now();
  emitMailboxRosterChangedLocal();

  const hubUrl = process.env.REALTIME_HUB_URL?.trim();
  const secret =
    process.env.REALTIME_HUB_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
  // In the worker the listeners above are the delivery; no HTTP hop needed.
  if (!hubUrl || !secret || listeners.size > 0) return;

  void fetch(`${hubUrl.replace(/\/$/, '')}/roster`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(2_000)
  }).catch(() => undefined);
}

/**
 * Fire and forget; never throws into the caller's query path. Bursts collapse
 * into one immediate signal plus one trailing signal, so a change made inside
 * the throttle window is still delivered.
 */
export function signalMailboxRosterChanged(): void {
  const wait = SEND_THROTTLE_MS - (Date.now() - lastSentAt);
  if (wait <= 0) {
    deliver();
    return;
  }
  if (trailing) return;
  trailing = setTimeout(() => {
    trailing = null;
    deliver();
  }, wait);
  trailing.unref?.();
}
