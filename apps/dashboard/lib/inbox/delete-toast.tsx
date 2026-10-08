import * as React from 'react';
import { toast } from 'sonner';

const TOAST_ID = 'mail-delete';

let total = 0;
let trashMode: boolean | null = null;

function reset(): void {
  total = 0;
  trashMode = null;
}

/**
 * One toast for a burst of deletions: later deletes update the count of the
 * visible toast in place (with a fade) instead of stacking new toasts.
 */
export function toastMailDeleted(count: number, inTrash: boolean): void {
  if (trashMode !== null && trashMode !== inTrash) {
    reset();
  }
  trashMode = inTrash;
  total += Math.max(count, 0);

  const message = inTrash ? `Deleted ${total}` : `Moved ${total} to Trash`;
  toast.success(
    <span
      key={total}
      className="inline-block animate-in fade-in duration-300"
    >
      {message}
    </span>,
    { id: TOAST_ID, onDismiss: reset, onAutoClose: reset }
  );
}
