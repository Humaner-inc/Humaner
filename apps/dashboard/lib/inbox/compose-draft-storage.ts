const VERSION = 'v1';

export type StoredComposeDraft = {
  to: string;
  subject: string;
  body: string;
  aliasId: string;
  threadId?: string;
  savedAt: number;
};

function storageKey(workspaceId: string): string {
  return `composeDraft:${VERSION}:${workspaceId}`;
}

export function saveComposeDraft(
  workspaceId: string,
  draft: Omit<StoredComposeDraft, 'savedAt'>
): void {
  try {
    const payload: StoredComposeDraft = {
      ...draft,
      savedAt: Date.now()
    };
    localStorage.setItem(storageKey(workspaceId), JSON.stringify(payload));
  } catch {
    // Incognito, quota, or disabled storage.
  }
}

export function loadComposeDraft(
  workspaceId: string
): StoredComposeDraft | null {
  try {
    const raw = localStorage.getItem(storageKey(workspaceId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<StoredComposeDraft>;
    if (
      typeof parsed.to !== 'string' ||
      typeof parsed.subject !== 'string' ||
      typeof parsed.body !== 'string' ||
      typeof parsed.aliasId !== 'string'
    ) {
      return null;
    }
    return {
      to: parsed.to,
      subject: parsed.subject,
      body: parsed.body,
      aliasId: parsed.aliasId,
      ...(typeof parsed.threadId === 'string'
        ? { threadId: parsed.threadId }
        : {}),
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now()
    };
  } catch {
    return null;
  }
}

export function clearComposeDraft(workspaceId: string): void {
  try {
    localStorage.removeItem(storageKey(workspaceId));
  } catch {
    // Ignore.
  }
}

export function composeDraftHasContent(
  draft: Pick<StoredComposeDraft, 'to' | 'subject' | 'body'>
): boolean {
  return (
    draft.to.trim().length > 0 ||
    draft.subject.trim().length > 0 ||
    draft.body.trim().length > 0
  );
}
