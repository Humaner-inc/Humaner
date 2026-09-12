export const OPEN_THREAD_NOTES_EVENT = 'humaner:open-thread-notes';

let pendingThreadId: string | null = null;

export function requestOpenThreadNotes(threadId: string): void {
  pendingThreadId = threadId;
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(OPEN_THREAD_NOTES_EVENT, { detail: { threadId } })
  );
}

export function consumeOpenThreadNotes(threadId: string): boolean {
  if (pendingThreadId !== threadId) return false;
  pendingThreadId = null;
  return true;
}

export function readOpenThreadNotesDetail(event: Event): string | null {
  if (!(event instanceof CustomEvent)) return null;
  const threadId = event.detail?.threadId;
  return typeof threadId === 'string' && threadId.length > 0 ? threadId : null;
}
